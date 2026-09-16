export interface OptimizationImpact {
  actualPowerW?: number;
  baselinePowerW?: number;
  savedPowerW?: number;
  energyBaselineKwh: number;
  energyActualKwh: number;
  energySavedKwh: number;
  savingsPercent: number;
  moneySaved: number;
  moneySavedEur?: number;
  co2AvoidedKg?: number;
  automatedActions: number;
}
