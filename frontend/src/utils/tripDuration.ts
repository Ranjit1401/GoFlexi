// Default budget allocation ratios matching backend ranking_service.py
export const DEFAULT_FLIGHT_BUDGET_RATIO = 0.45;
export const DEFAULT_HOTEL_BUDGET_RATIO = 0.55;

/**
 * Standardized duration calculator:
 * Standardized on backend definition: duration_days = number of calendar days
 * inclusive of both start and end date, i.e. (end - start).days + 1.
 */
export const calculateTripDays = (startDate: string, endDate: string): number => {
  try {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 4;
  }
};

export const calculateTripDuration = (startDate: string, endDate: string) => {
  const days = calculateTripDays(startDate, endDate);
  const nights = Math.max(0, days - 1);
  return {
    days,
    nights,
    formatted: `${days} Days / ${nights} Nights`,
  };
};
