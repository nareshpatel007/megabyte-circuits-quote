/**
 * Helper to determine if a PCB item or Quote configuration requires JLCPCB API quotation.
 * Delegates to centralized ManufacturingProviderResolver.
 */

export {
    type JlcpcbConditionCheckInput,
    type ManufacturingProvider,
    type ProviderResolutionResult,
    resolveManufacturingProvider,
    isJlcpcbRequired,
    isEligibleForInHouse,
    getMatchedJlcpcbConditions
} from "./manufacturingProviderResolver";
