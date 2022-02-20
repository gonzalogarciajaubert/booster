import { emit } from '../services/advice-emitter'
import { Booster } from '../index'

/*
* className could be calculated using metadata, a class annotation, etc... 
* for the time being this needs to be set in the annotation
*/
export function Around(className: string) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      emitWithConfig(className, 'AROUND_BEFORE', target, propertyKey, descriptor)
      const result = originalMethod.apply(this, args)
      emitWithConfig(className, 'AROUND_AFTER', target, propertyKey, descriptor)

      return result
    }
    return descriptor
  }
}

export function Before(className: string) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      emitWithConfig(className, 'BEFORE', target, propertyKey, descriptor)
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}

function emitWithConfig(className: string, adviceId: string, target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
  Booster.configureCurrentEnv((config): void => {
    emit(config, adviceId, {
      className: className,
      target: target,
      propertyKey: propertyKey,
      descriptor: descriptor,
    })
  })
}
