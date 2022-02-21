/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BoosterConfig,
  GraphQLOperation,
  InvalidParameterError,
  Logger,
  NotAuthorizedError,
  NotFoundError,
  ReadModelInterface,
  ReadModelListResult,
  ReadModelRequestEnvelope,
  ReadOnlyNonEmptyArray,
  SubscriptionEnvelope,
} from '@boostercloud/framework-types'
import { Booster } from './booster'
import { BoosterAuth } from './booster-auth'
import { applyReadModelRequestBeforeFunctions } from './services/filter-helpers'
import { AroundAdvice, BeforeAdvice } from './decorators/advices'
import { emit } from './services/advice-emitter'

export class BoosterReadModelsReader {
  public constructor(readonly config: BoosterConfig, readonly logger: Logger) {}

  @AroundAdvice('BoosterReadModelsReader')
  @BeforeAdvice('BoosterReadModelsReader')
  public async findById(
    readModelRequest: ReadModelRequestEnvelope<ReadModelInterface>
  ): Promise<ReadModelInterface | ReadOnlyNonEmptyArray<ReadModelInterface>> {
    try {
      emit(this.config, 'READMODELS_AROUND_BEFORE', { readModelName: readModelRequest.class.name, method: 'findById' })
      this.validateByIdRequest(readModelRequest)

      emit(this.config, 'READMODELS_BEFORE_CUSTOM', { readModelName: readModelRequest.class.name, method: 'findById' })

      const readModelMetadata = this.config.readModels[readModelRequest.class.name]
      const readModelTransformedRequest = applyReadModelRequestBeforeFunctions(
        readModelRequest,
        readModelMetadata.before
      )

      const key = readModelTransformedRequest.key
      if (!key) {
        throw 'Tried to run a findById operation without providing a key. An ID is required to perform this operation.'
      }
      return Booster.readModel(readModelMetadata.class).findById(key.id, key.sequenceKey)
    } finally {
      emit(this.config, 'READMODELS_AROUND_AFTER', { readModelName: readModelRequest.class.name, method: 'findById' })
    }
  }

  @AroundAdvice('BoosterReadModelsReader')
  @BeforeAdvice('BoosterReadModelsReader')
  public async search(
    readModelRequest: ReadModelRequestEnvelope<ReadModelInterface>
  ): Promise<Array<ReadModelInterface> | ReadModelListResult<ReadModelInterface>> {
    try {
      emit(this.config, 'READMODELS_AROUND_BEFORE', { readModelName: readModelRequest.class.name, method: 'search' })
      this.validateRequest(readModelRequest)

      emit(this.config, 'READMODELS_BEFORE_CUSTOM', { readModelName: readModelRequest.class.name, method: 'search' })
      const readModelMetadata = this.config.readModels[readModelRequest.class.name]
      const readModelTransformedRequest = applyReadModelRequestBeforeFunctions(
        readModelRequest,
        readModelMetadata.before
      )

      return Booster.readModel(readModelMetadata.class)
        .filter(readModelTransformedRequest.filters)
        .limit(readModelTransformedRequest.limit)
        .afterCursor(readModelTransformedRequest.afterCursor)
        .paginatedVersion(readModelTransformedRequest.paginatedVersion)
        .search()
    } finally {
      emit(this.config, 'READMODELS_AROUND_AFTER', { readModelName: readModelRequest.class.name, method: 'search' })
    }
  }

  @AroundAdvice('BoosterReadModelsReader')
  @BeforeAdvice('BoosterReadModelsReader')
  public async subscribe(
    connectionID: string,
    readModelRequest: ReadModelRequestEnvelope<ReadModelInterface>,
    operation: GraphQLOperation
  ): Promise<unknown> {
    this.validateRequest(readModelRequest)
    return this.processSubscription(connectionID, readModelRequest, operation)
  }

  @AroundAdvice('BoosterReadModelsReader')
  @BeforeAdvice('BoosterReadModelsReader')
  public async unsubscribe(connectionID: string, subscriptionID: string): Promise<void> {
    return this.config.provider.readModels.deleteSubscription(this.config, this.logger, connectionID, subscriptionID)
  }

  @AroundAdvice('BoosterReadModelsReader')
  @BeforeAdvice('BoosterReadModelsReader')
  public async unsubscribeAll(connectionID: string): Promise<void> {
    return this.config.provider.readModels.deleteAllSubscriptions(this.config, this.logger, connectionID)
  }

  private validateByIdRequest(readModelByIdRequest: ReadModelRequestEnvelope<ReadModelInterface>): void {
    this.logger.debug('Validating the following read model by id request: ', readModelByIdRequest)
    if (!readModelByIdRequest.version) {
      throw new InvalidParameterError('The required request "version" was not present')
    }

    const readModelMetadata = this.config.readModels[readModelByIdRequest.class.name]
    if (!readModelMetadata) {
      throw new NotFoundError(`Could not find read model ${readModelByIdRequest.class.name}`)
    }

    if (!BoosterAuth.isUserAuthorized(readModelMetadata.authorizedRoles, readModelByIdRequest.currentUser)) {
      throw new NotAuthorizedError(`Access denied for read model ${readModelByIdRequest.class.name}`)
    }

    if (
      readModelByIdRequest?.key?.sequenceKey &&
      readModelByIdRequest.key.sequenceKey.name !== this.config.readModelSequenceKeys[readModelByIdRequest.class.name]
    ) {
      throw new InvalidParameterError(
        `Could not find a sort key defined for ${readModelByIdRequest.class.name} named '${readModelByIdRequest.key.sequenceKey.name}'.`
      )
    }
  }

  private validateRequest(readModelRequest: ReadModelRequestEnvelope<ReadModelInterface>): void {
    this.logger.debug('Validating the following read model request: ', readModelRequest)
    if (!readModelRequest.version) {
      throw new InvalidParameterError('The required request "version" was not present')
    }

    const readModelMetadata = this.config.readModels[readModelRequest.class.name]
    if (!readModelMetadata) {
      throw new NotFoundError(`Could not find read model ${readModelRequest.class.name}`)
    }

    if (!BoosterAuth.isUserAuthorized(readModelMetadata.authorizedRoles, readModelRequest.currentUser)) {
      throw new NotAuthorizedError(`Access denied for read model ${readModelRequest.class.name}`)
    }
  }

  private async processSubscription(
    connectionID: string,
    readModelRequest: ReadModelRequestEnvelope<ReadModelInterface>,
    operation: GraphQLOperation
  ): Promise<void> {
    this.logger.info(
      `Processing subscription of connection '${connectionID}' to read model '${readModelRequest.class.name}' with the following data: `,
      readModelRequest
    )
    const readModelMetadata = this.config.readModels[readModelRequest.class.name]

    const newReadModelRequest = applyReadModelRequestBeforeFunctions(readModelRequest, readModelMetadata.before)

    const nowEpoch = Math.floor(new Date().getTime() / 1000)
    const subscription: SubscriptionEnvelope = {
      ...newReadModelRequest,
      expirationTime: nowEpoch + this.config.subscriptions.maxDurationInSeconds,
      connectionID,
      operation,
    }
    return this.config.provider.readModels.subscribe(this.config, this.logger, subscription)
  }
}
