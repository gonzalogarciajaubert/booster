import { BoosterConfig } from '../config'

export type EmitFunction = (config: BoosterConfig, emitId: string, emitParams: EmitParameters) => Promise<unknown>

export interface EmitParameters {
  [key: string]: any
}
