/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Pushgateway, Registry } from 'prom-client'
import * as prometheusClient from 'prom-client'
import * as http from 'http'
import { BoosterConfig } from '@boostercloud/framework-types'

export interface PushGatewayGroupingOptions {
  [key: string]: string
}

// TODO make prometheus GATEWAY configurable: timeout, security, etc...
// TODO publish method: sync vs asyn, push vs pushAdd vs ...
export class PrometheusBase {
  static PROMETHEUS_PREFIX = 'BOOSTER'

  private readonly _gateway: Pushgateway
  private readonly _register: Registry
  // TODO rename to prometheusGatewayUrl
  constructor(readonly config: BoosterConfig, readonly prometheusUrl: string) {
    const Registry = prometheusClient.Registry
    this._register = new Registry()
    this._register.setDefaultLabels({ boosterVersion: process.env.npm_package_version });
    this._gateway = new prometheusClient.Pushgateway(
      prometheusUrl,
      {
        timeout: 5000,
        agent: new http.Agent({
          keepAlive: true,
          keepAliveMsecs: 10000,
          maxSockets: 5,
        }),
      },
      this._register
    )
  }

  get gateway(): Pushgateway {
    return this._gateway
  }

  get register(): Registry {
    return this._register
  }

  public async publish(groupings?: PushGatewayGroupingOptions): Promise<void> {
    await this.gateway
      .push({ jobName: this.config.appName, groupings: groupings })
      .then(({ resp, body }) => {
        // @ts-ignore
        if (resp.statusCode !== '200') {
          // @ts-ignore
          console.error('*** PROMETHEUS:Error:', resp.statusCode)
        }
      })
      .catch((err) => {
        console.error(`*** PROMETHEUS:Error: ${err}`)
        throw new Error('*** PROMETHEUS:Error pushing a Prometheus')
      })
  }
}
