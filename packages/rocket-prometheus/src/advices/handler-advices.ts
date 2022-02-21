import { PrometheusMetric } from '../prometheus/prometheus-metrics'
import { BoosterConfig, EmitParameters, AdviceTypes } from '@boostercloud/framework-types'

export class HandlerAdvices {
  private readonly PrometheusMetric: PrometheusMetric

  constructor(config: BoosterConfig, prometheusUrl: string) {
    this.PrometheusMetric = new PrometheusMetric(config, prometheusUrl)
  }
  
  // TODO remove config parameter
  public handle(config: BoosterConfig, adviceType: AdviceTypes, adviseParams: EmitParameters): void {
    switch (adviceType) {
      case AdviceTypes.READ_MODELS_HIT:
        this.PrometheusMetric.incReadModel(1, adviseParams['readModelName'], adviseParams['method'])
        break
      case AdviceTypes.EVENT_PROCESSOR_HIT:
        this.PrometheusMetric.incEventProcessor(1, adviseParams['entityName'])
        break
      case AdviceTypes.ENTITY_REDUCER_HIT:
        this.PrometheusMetric.incReducer(1, adviseParams['entityTypeName'])
        break
      case AdviceTypes.EVENT_READ_HIT:
        this.PrometheusMetric.incEventRead(1, adviseParams['by'])
        break
      case AdviceTypes.BEFORE:
        this.PrometheusMetric.incMethod(1, adviseParams['className'], adviseParams['propertyKey'])
        break
      case AdviceTypes.AROUND_BEFORE:
        this.PrometheusMetric.startMethod(adviseParams['className'], adviseParams['propertyKey'])
        break
      case AdviceTypes.AROUND_AFTER:
        this.PrometheusMetric.endMethod()
        break
    }
  }
}
