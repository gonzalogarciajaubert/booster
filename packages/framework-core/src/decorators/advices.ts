import { emit } from '../services/advice-emitter'
import { Booster } from '../index'
import { AdviceTypes } from '@boostercloud/framework-types'

/*
* className could be calculated using metadata, a class annotation, etc... 
* for the time being this needs to be set in the annotation
*/
export function AroundAdvice(className: string) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      emitWithConfig(className, AdviceTypes.AROUND_BEFORE, target, propertyKey, descriptor)
      const result = originalMethod.apply(this, args)
      emitWithConfig(className, AdviceTypes.AROUND_AFTER, target, propertyKey, descriptor)

      return result
    }
    return descriptor
  }
}

export function BeforeAdvice(className: string) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      emitWithConfig(className, AdviceTypes.BEFORE, target, propertyKey, descriptor)
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}

function emitWithConfig(className: string, adviceType: AdviceTypes, target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
  Booster.configureCurrentEnv((config): void => {
    emit(config, adviceType, {
      className: className,
      target: target,
      propertyKey: propertyKey,
      descriptor: descriptor,
    })
  })
}
