import { AdviceTypes, BoosterConfig, EmitParameters } from '@boostercloud/framework-types'

export function emit(config: BoosterConfig, adviceType: AdviceTypes, emitParams: EmitParameters): void {
  if (Object.keys(config.advisersFunctionMap).length > 0) {
    Object.entries(config.advisersFunctionMap).forEach(async (adviseEntry) => {
      const [_key, func] = adviseEntry
      await func(config, adviceType, emitParams)
    })
  }
}
