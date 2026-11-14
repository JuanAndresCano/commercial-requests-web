export interface PeriodOption<T> {
  value: T;
  label: string;
  isAvailable: boolean;
}

/**
 * Checks whether a quarter or month in a given year is strictly in the future.
 */
export function isPeriodInFuture(
  year: number,
  period: { month?: number; quarter?: number },
  referenceDate: Date = new Date(),
): boolean {
  const currentYear = referenceDate.getFullYear();
  if (year > currentYear) return true;
  if (year < currentYear) return false;

  const currentMonth = referenceDate.getMonth() + 1;
  if (period.month !== undefined) {
    return period.month > currentMonth;
  }
  if (period.quarter !== undefined) {
    const currentQuarter = Math.ceil(currentMonth / 3);
    return period.quarter > currentQuarter;
  }
  return false;
}

/**
 * Checks whether a quarter or month in a given year is strictly before the earliest recorded data.
 */
export function isPeriodBeforeHistory(
  year: number,
  period: { month?: number; quarter?: number },
  minAvailableDate?: string,
): boolean {
  if (!minAvailableDate) return false;
  const minDate = new Date(minAvailableDate);
  if (Number.isNaN(minDate.getTime())) return false;

  const minYear = minDate.getUTCFullYear();
  if (year < minYear) return true;
  if (year > minYear) return false;

  const minMonth = minDate.getUTCMonth() + 1;
  if (period.month !== undefined) {
    return period.month < minMonth;
  }
  if (period.quarter !== undefined) {
    const minQuarter = Math.ceil(minMonth / 3);
    return period.quarter < minQuarter;
  }
  return false;
}
