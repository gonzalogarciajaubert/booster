import { BoosterConfig, RocketDescriptor, EmitParameters } from '@boostercloud/framework-types'
import { HandlerAdvices } from './advices/handler-advices'

export class BoosterRocketPrometheus {
  public constructor(readonly config: BoosterConfig, readonly prometheusUrl: string) {
    const handler = new HandlerAdvices(config, prometheusUrl)
    config.registerAdviceFunction(
      'PROMETHEUS_ADVISE',
      async (config: BoosterConfig, emitId: string, adviseParams: EmitParameters) => {
        handler.handle(config, emitId, adviseParams)
      }
    )
  }

  public configure(): RocketDescriptor {
    return {
      packageName: '@boostercloud/rocket-prometheus-infrastructure',
      parameters: this.prometheusUrl,
    }
  }
}
