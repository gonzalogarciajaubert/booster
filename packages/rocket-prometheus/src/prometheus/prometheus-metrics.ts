import { PrometheusCounter } from './prometheus-counter'
import { PrometheusBase } from './prometheus-base'
import { PrometheusGauge } from './prometheus-gauge'
import { BoosterConfig } from '@boostercloud/framework-types'

export class PrometheusMetric {
  private readonly _prometheusBase: PrometheusBase
  private readonly _prometheusCounters: Array<PrometheusCounter> = []
  private readonly _PrometheusGauges: Array<PrometheusGauge> = []

  constructor(config: BoosterConfig, prometheusUrl: string) {
    this._prometheusBase = new PrometheusBase(config, prometheusUrl)
  }

  public incReadModel(value: number, readModelName: string, methodName: string): void {
    this.inc(value, 'booster_readmodel_total_count', ['readModelName', 'methodName'], [readModelName, methodName])
  }

  public startReadModel(readModelName: string, methodName: string): void {
    this.start('booster_readmodel_duration_ms_count', ['readModelName', 'methodName'], [readModelName, methodName])
  }

  public endReadModel(): void {
    this.end('booster_readmodel_duration_ms_count', ['readModelName', 'methodName'])
  }

  public incEventProcessor(value: number, eventName: string): void {
    this.inc(value, 'booster_events_total_count', ['eventName'], [eventName])
  }

  public startEventProcessor(eventName: string): void {
    this.start('booster_events_duration_ms_count', ['eventName'], [eventName])
  }

  public endEventProcessor(): void {
    this.end('booster_events_duration_ms_count', ['eventName'])
  }

  public incReducer(value: number, eventName: string): void {
    this.inc(value, 'booster_reducer_total_count', ['eventName'], [eventName])
  }

  public incMethod(value: number, className: string, methodName: string): void {
    this.inc(value, 'booster_methods_total_count', ['className', 'methodName'], [className, methodName])
  }

  public startMethod(className: string, methodName: string): void {
    this.start('booster_methods_duration_ms_count', ['className', 'methodName'], [className, methodName])
  }

  public endMethod(): void {
    this.end('booster_methods_duration_ms_count', ['className', 'methodName'])
  }

  private inc(incValue: number, metricName: string, labelsNames: Array<string>, values: Array<string>): void {
    const prometheusCounter = this.getPrometheusCounter(metricName, labelsNames)
    prometheusCounter.inc(incValue, values)
    void this._prometheusBase.publish()
  }

  private start(metricName: string, labelsNames: Array<string>, values: Array<string>): void {
    const prometheusGaugage = this.getPrometheusGauge(metricName, labelsNames)
    prometheusGaugage.preGauge(values)
  }

  private end(metricName: string, labelsNames: Array<string>): void {
    const prometheusGauge = this.getPrometheusGauge(metricName, labelsNames)
    prometheusGauge.postGauge()
    void this._prometheusBase.publish()
  }

  private getPrometheusCounter(metricName: string, labelsNames: Array<string>): PrometheusCounter {
    const existingCounter = this._prometheusCounters.find((counter) => counter.metricName === metricName)
    if (existingCounter) {
      return existingCounter
    }
    const newCounter = new PrometheusCounter(this._prometheusBase.register, metricName, labelsNames)
    this._prometheusCounters.push(newCounter)
    return newCounter
  }

  private getPrometheusGauge(metricName: string, labelsNames: Array<string>): PrometheusGauge {
    const existingGauge = this._PrometheusGauges.find((gaugage) => gaugage.metricName === metricName)
    if (existingGauge) {
      return existingGauge
    }
    const newGauge = new PrometheusGauge(this._prometheusBase.register, metricName, labelsNames)
    this._PrometheusGauges.push(newGauge)
    return newGauge
  }
}
