import { Counter, Registry } from 'prom-client'
import * as prometheusClient from 'prom-client'

export class PrometheusCounter {
  private readonly counterMetric: Counter<string>

  constructor(readonly register: Registry, readonly metricName: string, readonly labels: Array<string>) {
    this.counterMetric = new prometheusClient.Counter({
      name: metricName,
      help: `${metricName}_help`,
      registers: [this.register],
      labelNames: labels,
    })
    this.register.registerMetric(this.counterMetric)
  }

  public inc(value: number, labelValues: Array<string>): void {
    this.counterMetric.labels(...labelValues).inc(value)
  }
}
