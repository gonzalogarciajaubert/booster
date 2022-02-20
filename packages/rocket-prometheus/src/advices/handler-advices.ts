import { PrometheusMetric } from '../prometheus/prometheus-metrics'
import { BoosterConfig, EmitParameters } from '@boostercloud/framework-types'

export class HandlerAdvices {
  private readonly PrometheusMetric: PrometheusMetric

  constructor(config: BoosterConfig, prometheusUrl: string) {
    this.PrometheusMetric = new PrometheusMetric(config, prometheusUrl)
  }

  public handle(config: BoosterConfig, emitId: string, adviseParams: EmitParameters): void {
    if (!this.handleReadModels(emitId, adviseParams)) {
      if (!this.handleEventProcessor(emitId, adviseParams)) {
        this.handleAnnotations(emitId, adviseParams)
      }
    }
  }

  private handleReadModels(emitId: string, adviseParams: EmitParameters): boolean {
    let found = false
    switch (emitId) {
      case 'READMODELS_BEFORE_CUSTOM':
        found = true
        this.PrometheusMetric.incReadModel(1, adviseParams['readModelName'], adviseParams['method'])
        break
      case 'READMODELS_AROUND_BEFORE':
        found = true
        this.PrometheusMetric.startReadModel(adviseParams['readModelName'], adviseParams['method'])
        break
      case 'READMODELS_AROUND_AFTER':
        found = true
        this.PrometheusMetric.endReadModel(adviseParams['readModelName'], adviseParams['method'])
        break
    }
    return found
  }

  private handleEventProcessor(emitId: string, adviseParams: EmitParameters): boolean {
    let found = false
    switch (emitId) {
      case 'EVENTPROCESSOR_BEFORE_CUSTOM':
        found = true
        this.PrometheusMetric.incEventProcessor(1, adviseParams['entityName'])
        break
      case 'EVENTPROCESSOR_AROUND_BEFORE':
        found = true
        this.PrometheusMetric.startEventProcessor(adviseParams['entityName'])
        break
      case 'EVENTPROCESSOR_AROUND_AFTER':
        found = true
        this.PrometheusMetric.endEventProcessor(adviseParams['entityName'])
        break
    }
    return found
  }


  private handleAnnotations(emitId: string, adviseParams: EmitParameters): void {
    const className = adviseParams['className']
    const methodName = adviseParams['propertyKey']
    switch (emitId) {
      case 'BEFORE':
        this.PrometheusMetric.incMethod(1, className, methodName)
        break
      case 'AROUND_BEFORE':
        this.PrometheusMetric.startMethod(className, methodName)
        break
      case 'AROUND_AFTER':
        this.PrometheusMetric.endMethod(className, methodName)
        break
    }
  }
}
