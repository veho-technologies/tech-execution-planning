import { LoadBalancedFargateService, VehoRDSCluster, VehoStack, VehoStackProps } from '@veho/cdk'
import { Duration, SecretValue, Stack } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { ApplicationProtocol, NetworkLoadBalancer, Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { AlbListenerTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import { AccountPrincipal } from 'aws-cdk-lib/aws-iam'
import * as rds from 'aws-cdk-lib/aws-rds'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import * as path from 'path'
import { prefixList } from './config/prefixList'

export interface DatabaseOptions {
  readonly adminUsername: string
  readonly appUsername: string
  readonly databaseName: string
  readonly poolMin?: number
  readonly poolMax?: number
}

export interface AppStackProps extends VehoStackProps {
  readonly certificateArn: string
  readonly databaseOptions: DatabaseOptions
  readonly linearApiKeySecretName: string
  readonly vpnAccountId: string
  readonly vpcEndpointServiceNameSecretName: string
  readonly fargateConfig?: {
    readonly cpu?: number
    readonly memoryLimitMiB?: number
    readonly minCapacity?: number
    readonly maxCapacity?: number
  }
}

export class AppStack extends VehoStack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { appEnvironment = 'dev', databaseOptions, certificateArn, fargateConfig = {} } = props

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true }) as ec2.Vpc

    // Database
    const dbInstanceType =
      appEnvironment === 'prod'
        ? ec2.InstanceType.of(ec2.InstanceClass.R7G, ec2.InstanceSize.LARGE)
        : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM)

    const writer = rds.ClusterInstance.provisioned('writer', {
      instanceType: dbInstanceType,
      enablePerformanceInsights: true,
    })

    const readers = [
      rds.ClusterInstance.provisioned('reader1', {
        instanceType: dbInstanceType,
        enablePerformanceInsights: true,
      }),
    ]

    const dbCluster = new VehoRDSCluster(this, 'DbCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_8,
      }),
      credentials: rds.Credentials.fromGeneratedSecret(databaseOptions.adminUsername, {
        secretName: `/${Stack.of(this).stackName}/database`,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      }),
      writer,
      readers,
      defaultDatabaseName: databaseOptions.databaseName,
      proxyOptions: {
        idleClientTimeout: Duration.minutes(10),
        maxConnectionsPercent: 99,
      },
      users: [{ roleName: databaseOptions.appUsername }],
    })

    const proxy = dbCluster.defaultProxy

    // Security group for Fargate → RDS Proxy access
    const computeSg = new ec2.SecurityGroup(this, 'compute-sg', {
      vpc,
      description: 'Security group for Fargate service to access RDS Proxy',
    })
    proxy.connections.allowFrom(computeSg, ec2.Port.tcp(5432))

    // Allow CircleCI IP ranges to access DB cluster directly (for migrations)
    const cfnPrefixList = new ec2.CfnPrefixList(this, 'PrefixList', prefixList)
    dbCluster.connections.allowFrom(ec2.Peer.prefixList(cfnPrefixList.attrPrefixListId), ec2.Port.tcp(5432))

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc })

    // Build Next.js Docker image from Dockerfile
    const imageAsset = new DockerImageAsset(this, 'AppImage', {
      directory: path.join(__dirname, '..', '..'),
      platform: Platform.LINUX_ARM64,
    })

    // ACM certificate for HTTPS on ALB
    const certificate = Certificate.fromCertificateArn(this, 'Cert', certificateArn)

    // Database credentials from Secrets Manager (auto-created by VehoRDSCluster)
    const dbSecret = dbCluster.secret!

    // Linear API Key (must be created manually in Secrets Manager before first deploy)
    const linearSecret = Secret.fromSecretNameV2(this, 'LinearApiKey', props.linearApiKeySecretName)

    // Container environment variables
    const containerEnvVars: Record<string, string> = {
      DATABASE_HOST: proxy.endpoint,
      DATABASE_PORT: '5432',
      DATABASE_NAME: databaseOptions.databaseName,
      DATABASE_USERNAME: databaseOptions.adminUsername,
      DATABASE_POOL_MIN: (databaseOptions.poolMin ?? 0).toString(),
      DATABASE_POOL_MAX: (databaseOptions.poolMax ?? 10).toString(),
      NODE_ENV: 'production',
    }

    // Container secrets (injected from Secrets Manager)
    const containerSecrets: Record<string, ecs.Secret> = {
      DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      LINEAR_API_KEY: ecs.Secret.fromSecretsManager(linearSecret),
    }

    // Load Balanced Fargate Service (Next.js behind ALB + WAF)
    const webApp = new LoadBalancedFargateService(this, 'WebApp', {
      serviceProps: {
        serviceName: `tech-execution-planning-${appEnvironment}`,
        environment: appEnvironment,
        cluster,
        image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
        containerPort: 3000,
        containerEnvironmentVars: containerEnvVars,
        containerSecrets,
        securityGroups: [computeSg],
        cpu: fargateConfig.cpu ?? (appEnvironment === 'prod' ? 1024 : 512),
        memoryLimitMiB: fargateConfig.memoryLimitMiB ?? (appEnvironment === 'prod' ? 2048 : 1024),
        healthCheckGracePeriod: Duration.seconds(60),
        defaultAutoscalingConfig: {
          minCapacity: fargateConfig.minCapacity ?? (appEnvironment === 'prod' ? 2 : 1),
          maxCapacity: fargateConfig.maxCapacity ?? (appEnvironment === 'prod' ? 10 : 3),
        },
      },
      loadBalancerProps: {
        loadBalancerName: `tep-${appEnvironment}`,
        internetFacing: false,
        vpc,
      },
      targetGroupProps: {
        port: 3000,
        protocol: ApplicationProtocol.HTTP,
        healthCheck: {
          path: '/api/health',
          interval: Duration.seconds(15),
          timeout: Duration.seconds(5),
        },
      },
      listenerProps: {
        certificates: [certificate],
      },
    })

    // NLB for PrivateLink (TCP passthrough to ALB on port 443)
    const nlb = new NetworkLoadBalancer(this, 'Nlb', {
      vpc,
      internetFacing: false,
      crossZoneEnabled: true,
      loadBalancerName: `tep-nlb-${appEnvironment}`,
    })

    const nlbListener = nlb.addListener('https', {
      port: 443,
      protocol: Protocol.TCP,
    })

    nlbListener.addTargets('alb', {
      port: 443,
      protocol: Protocol.TCP,
      targets: [new AlbListenerTarget(webApp.listener)],
    })

    // VPC Endpoint Service (exposes NLB via PrivateLink)
    const endpointService = new ec2.VpcEndpointService(this, 'EndpointService', {
      vpcEndpointServiceLoadBalancers: [nlb],
      acceptanceRequired: false,
      allowedPrincipals: [new AccountPrincipal(props.vpnAccountId)],
    })

    // Store endpoint service name in Secrets Manager for cross-account consumption
    new Secret(this, 'VpceServiceNameSecret', {
      secretName: props.vpcEndpointServiceNameSecretName,
      secretStringValue: SecretValue.unsafePlainText(endpointService.vpcEndpointServiceName),
      description: 'VPC Endpoint Service name for tech-execution-planning',
    })
  }
}
