/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Gauge, Registry } from 'prom-client'
import * as prometheusClient from 'prom-client'

export class PrometheusGauge {
  private readonly gaugageMetric: Gauge<string>
  private instance: any

  constructor(readonly register: Registry, readonly metricName: string, readonly labels: Array<string>) {
    this.gaugageMetric = new prometheusClient.Gauge({
      name: metricName,
      help: `${metricName}_help`,
      registers: [this.register],
      labelNames: labels,
    })
    this.register.registerMetric(this.gaugageMetric)
  }

  public preGauge(labelValues: Array<string>): void {
    this.gaugageMetric.labels(...labelValues).setToCurrentTime()
    this.instance = this.gaugageMetric.labels(...labelValues).startTimer()
  }

  public postGauge(): void {
    this.instance()
  }
}
