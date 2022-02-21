import { AdviceTypes } from '..'
import { BoosterConfig } from '../config'

export type EmitFunction = (config: BoosterConfig, adviceType: AdviceTypes, emitParams: EmitParameters) => Promise<unknown>

export interface EmitParameters {
  [key: string]: any
}
