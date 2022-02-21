import { BoosterConfig, RocketDescriptor, EmitParameters, AdviceTypes } from '@boostercloud/framework-types'
import { HandlerAdvices } from './advices/handler-advices'

export class BoosterRocketPrometheus {
  public constructor(readonly config: BoosterConfig, readonly prometheusUrl: string) {
    const handler = new HandlerAdvices(config, prometheusUrl)
    config.registerAdviceFunction(
      'PROMETHEUS_ADVISE',
      async (config: BoosterConfig, adviceType: AdviceTypes, adviseParams: EmitParameters) => {
        handler.handle(config, adviceType, adviseParams)
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
