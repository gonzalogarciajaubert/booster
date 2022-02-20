import { InfrastructureRocket } from '@boostercloud/framework-provider-local-infrastructure'
import { Infra } from './infra'

// TODO this is needed because now boosters rockets needs an infra package. This one do nothing
const GlobalRocketPrometheus = (params: unknown): InfrastructureRocket => ({
  mountStack: Infra.mountStack.bind(Infra, params),
})

export default GlobalRocketPrometheus
