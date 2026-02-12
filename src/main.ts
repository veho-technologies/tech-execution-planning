import { App } from 'aws-cdk-lib'

import { DnsStack } from './stacks/dns-stack'
import { AppStack } from './stacks/stack'
import { VpnStack } from './stacks/vpn-stack'

const TAGS = {
  Service: 'tech-execution-planning',
  Team: 'Engineering',
  ProductArea: 'Engineering Tools',
  Organization: 'Engineering',
  Tier: 'Tier4',
}

const app = new App()
const region = 'us-east-1'

const APP_SUB_DOMAIN_NAME = 'tech-execution-planning'
const VPC_ENDPOINT_SERVICE_NAME_SECRET = '/tech-execution-planning/vpce-service-name/'
const VPN_ACCOUNT_ID = '586640158005'
const VPC_ENDPOINT_DOMAIN_NAME_SECRET = '/tech-execution-planning/vpce-domain-name/'
const DEV_ACCOUNT_ID = '657230704726'

const DATABASE_OPTIONS = {
  adminUsername: 'clusterAdmin',
  appUsername: 'app',
  databaseName: 'tech_execution_planning',
  poolMin: 0,
  poolMax: 10,
}

const appStack = new AppStack(app, 'tech-execution-planning-dev', {
  stackName: 'tech-execution-planning',
  env: { account: DEV_ACCOUNT_ID, region },
  appEnvironment: 'dev',
  teamName: 'Engineering',
  isEphemeral: false,
  certificateArn: 'arn:aws:acm:us-east-1:657230704726:certificate/3bc82431-2bdc-4ef2-9a2f-84bb0130aee7',
  databaseOptions: DATABASE_OPTIONS,
  linearApiKeySecretName: '/tech-execution-planning/dev/linear-api-key',
  vpnAccountId: VPN_ACCOUNT_ID,
  vpcEndpointServiceNameSecretName: VPC_ENDPOINT_SERVICE_NAME_SECRET,
  tags: TAGS,
})

// VPN + DNS stacks require cross-account access (VPN account 586640158005)
// Only created in CI/CD where OIDC credentials cover both accounts
if (process.env.CI) {
  const vpnStack = new VpnStack(app, 'tech-execution-planning-dev-vpn', {
    stackName: 'tech-execution-planning-dev',
    env: { region, account: VPN_ACCOUNT_ID },
    tags: TAGS,
    vpcEndpointServiceNameSecretArnPrefix: `arn:aws:secretsmanager:${region}:${DEV_ACCOUNT_ID}:secret:${VPC_ENDPOINT_SERVICE_NAME_SECRET}`,
    vpcEndpointDomainNameSecretName: VPC_ENDPOINT_DOMAIN_NAME_SECRET,
    workloadAccountId: DEV_ACCOUNT_ID,
  })
  vpnStack.addDependency(appStack)

  const dnsStack = new DnsStack(app, 'tech-execution-planning-dev-dns', {
    stackName: 'tech-execution-planning-dns',
    env: { region, account: DEV_ACCOUNT_ID },
    tags: TAGS,
    vpcEndpointDomainNameSecretArnPrefix: `arn:aws:secretsmanager:${region}:${VPN_ACCOUNT_ID}:secret:${VPC_ENDPOINT_DOMAIN_NAME_SECRET}`,
    subDomainName: APP_SUB_DOMAIN_NAME,
  })
  dnsStack.addDependency(vpnStack)
}

app.synth()
