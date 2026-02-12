import { Fn, SecretValue, Stack, StackProps } from 'aws-cdk-lib'
import { CnameRecord, HostedZone } from 'aws-cdk-lib/aws-route53'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'

export interface DnsStackProps extends StackProps {
  readonly vpcEndpointDomainNameSecretArnPrefix: string
  readonly subDomainName: string
}

export class DnsStack extends Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props)

    const { vpcEndpointDomainNameSecretArnPrefix, subDomainName } = props
    const vpcEndpointDomainNameSecret = Secret.fromSecretPartialArn(
      this,
      'endpoint-service-name',
      vpcEndpointDomainNameSecretArnPrefix
    )
    const endpointDomainName = SecretValue.secretsManager(vpcEndpointDomainNameSecret.secretArn).unsafeUnwrap()

    const appDomainName = Fn.importValue('custom-domains-AppDomain')
    const appHostedZone = HostedZone.fromHostedZoneAttributes(this, 'app-hosted-zone', {
      hostedZoneId: Fn.importValue('custom-domains-AppHostedZoneId'),
      zoneName: appDomainName,
    })

    new CnameRecord(this, 'vpn-vpc-endpoint-cname', {
      zone: appHostedZone,
      recordName: subDomainName,
      domainName: endpointDomainName,
    })
  }
}
