import { Fn, SecretValue, Stack, StackProps } from 'aws-cdk-lib'
import { InterfaceVpcEndpoint, InterfaceVpcEndpointService, Vpc } from 'aws-cdk-lib/aws-ec2'
import { AccountPrincipal } from 'aws-cdk-lib/aws-iam'
import { Key } from 'aws-cdk-lib/aws-kms'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'

const VPN_VPC_ID = 'vpc-01b4c3fd9dca9fc91'

export interface VpnStackProps extends StackProps {
  readonly vpcEndpointServiceNameSecretArnPrefix: string
  readonly vpcEndpointDomainNameSecretName: string
  readonly workloadAccountId: string
}

export class VpnStack extends Stack {
  constructor(scope: Construct, id: string, props: VpnStackProps) {
    super(scope, id, props)

    const { vpcEndpointServiceNameSecretArnPrefix, vpcEndpointDomainNameSecretName, workloadAccountId } = props

    const endpointServiceNameSecret = Secret.fromSecretPartialArn(
      this,
      'endpoint-service-name',
      vpcEndpointServiceNameSecretArnPrefix
    )
    const endpointServiceName = SecretValue.secretsManager(endpointServiceNameSecret.secretArn).unsafeUnwrap()

    const vpnVpc = Vpc.fromLookup(this, 'vpn-vpc', { vpcId: VPN_VPC_ID })
    const vpnEndpoint = new InterfaceVpcEndpoint(this, 'vpn-endpoint', {
      vpc: vpnVpc,
      subnets: {
        availabilityZones: ['us-east-1a'],
      },
      service: new InterfaceVpcEndpointService(endpointServiceName, 443),
    })

    const key = new Key(this, 'cross-account-param-key')
    const vpcEndpointDomainSecret = new Secret(this, 'vpc-endpoint-domain-name', {
      secretName: vpcEndpointDomainNameSecretName,
      secretStringValue: SecretValue.unsafePlainText(
        Fn.select(1, Fn.split(':', Fn.select(0, vpnEndpoint.vpcEndpointDnsEntries)))
      ),
      description: 'Tech execution planning VPC endpoint domain name',
      encryptionKey: key,
    })
    const workloadAccount = new AccountPrincipal(workloadAccountId)
    vpcEndpointDomainSecret.grantRead(workloadAccount)
  }
}
