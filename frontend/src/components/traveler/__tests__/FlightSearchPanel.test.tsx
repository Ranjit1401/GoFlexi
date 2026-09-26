import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FlightSearchPanel } from '../FlightSearchPanel';
import * as travelSearchService from '../../../services/travel-search';
import { calculateTripDays, calculateTripDuration, DEFAULT_FLIGHT_BUDGET_RATIO, DEFAULT_HOTEL_BUDGET_RATIO } from '../../../utils/tripDuration';

vi.mock('../../../services/travel-search', () => ({
  searchFlights: vi.fn(),
  searchAirports: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('FlightSearchPanel Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (travelSearchService.searchFlights as any).mockResolvedValue({ results: [] });
  });

  it('(c) FlightSearchPanel re-searches when initialOrigin prop changes after mount', async () => {
    const { rerender } = render(
      <FlightSearchPanel
        initialOrigin="Mumbai"
        initialDestination="Goa"
        initialDepartDate="2026-10-15"
        initialReturnDate="2026-10-18"
      />
    );

    // Initial search should be performed with Mumbai
    await waitFor(() => {
      expect(travelSearchService.searchFlights).toHaveBeenCalledTimes(1);
      expect(travelSearchService.searchFlights).toHaveBeenCalledWith(
        expect.objectContaining({ origin: 'Mumbai', destination: 'Goa' })
      );
    });

    const originInput = screen.getByLabelText(/origin city/i) as HTMLInputElement;
    expect(originInput.value).toBe('Mumbai');

    // Re-render with new initialOrigin prop (simulating user editing "Departing From" in Step 1)
    rerender(
      <FlightSearchPanel
        initialOrigin="Delhi"
        initialDestination="Goa"
        initialDepartDate="2026-10-15"
        initialReturnDate="2026-10-18"
      />
    );

    // Should update input and re-search with Delhi
    await waitFor(() => {
      expect(travelSearchService.searchFlights).toHaveBeenCalledTimes(2);
      expect(travelSearchService.searchFlights).toHaveBeenLastCalledWith(
        expect.objectContaining({ origin: 'Delhi', destination: 'Goa' })
      );
    });

    expect(originInput.value).toBe('Delhi');
  });
});

describe('Duration calculation consistency across frontend and backend', () => {
  it('(b) duration_days/calculateDuration()/handleSaveTrip() all agree for sample date ranges', () => {
    // Sample date range: 2026-10-15 to 2026-10-18
    const start = '2026-10-15';
    const end = '2026-10-18';

    // Backend logic: max(1, (end_d - start_d).days + 1)
    const backendStart = new Date(start);
    const backendEnd = new Date(end);
    const backendDurationDays = Math.max(
      1,
      Math.round((backendEnd.getTime() - backendStart.getTime()) / 86400000) + 1
    );

    // Frontend calculateTripDays logic (used by handleSaveTrip)
    const frontendDays = calculateTripDays(start, end);

    // Frontend calculateDuration logic (used in Step 2 Estimated Trip Duration)
    const durationDetails = calculateTripDuration(start, end);

    // All three must agree: 4 days and 3 nights
    expect(backendDurationDays).toBe(4);
    expect(frontendDays).toBe(4);
    expect(durationDetails.days).toBe(4);
    expect(durationDetails.nights).toBe(3);
    expect(durationDetails.formatted).toBe('4 Days / 3 Nights');

    // Single-day trip: 2026-10-15 to 2026-10-15
    const singleDayDays = calculateTripDays('2026-10-15', '2026-10-15');
    const singleDayDuration = calculateTripDuration('2026-10-15', '2026-10-15');
    expect(singleDayDays).toBe(1);
    expect(singleDayDuration.days).toBe(1);
    expect(singleDayDuration.nights).toBe(0);
    expect(singleDayDuration.formatted).toBe('1 Days / 0 Nights');
  });

  it('Default budget split ratios match backend ranking_service (0.45 / 0.55)', () => {
    expect(DEFAULT_FLIGHT_BUDGET_RATIO).toBe(0.45);
    expect(DEFAULT_HOTEL_BUDGET_RATIO).toBe(0.55);
    expect(DEFAULT_FLIGHT_BUDGET_RATIO + DEFAULT_HOTEL_BUDGET_RATIO).toBe(1.0);
  });
});
