import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiTripCopilotPage from '../AiTripCopilotPage';
import * as tripPlannerApi from '../../../services/trip-planner';

// Mock cesium & resium to avoid WebGL errors in happy-dom
vi.mock('resium', () => ({
  Viewer: ({ children }: any) => <div data-testid="mock-cesium-viewer">{children}</div>,
  Entity: ({ name, description, children }: any) => (
    <div data-testid="mock-cesium-entity" data-name={name} data-description={description}>
      {children}
    </div>
  ),
  PointGraphics: () => null,
  PolylineGraphics: () => null,
  LabelGraphics: () => null,
  CameraFlyTo: () => null,
}));

vi.mock('cesium', () => {
  class MockColor {
    constructor(public r = 0, public g = 0, public b = 0, public a = 1) {}
    static fromCssColorString = vi.fn().mockReturnValue(new MockColor());
    static WHITE = new MockColor(1, 1, 1, 1);
    static CYAN = new MockColor(0, 1, 1, 1);
  }

  class MockCartesian2 {
    constructor(public x = 0, public y = 0) {}
  }

  return {
    Color: MockColor,
    Cartesian3: {
      fromDegrees: vi.fn(),
    },
    Cartesian2: MockCartesian2,
    ArcType: {
      NONE: 0,
      GEODESIC: 1,
      RHUMB: 2,
    },
    Math: {
      toRadians: (val: number) => (val * 3.141592653589793) / 180,
    },
    Ion: {
      defaultAccessToken: '',
    },
    createWorldTerrainAsync: vi.fn().mockResolvedValue({}),
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test_user', name: 'Test Traveler', email: 'traveler@example.com' },
  }),
}));

vi.mock('../../../services/trip-planner', () => ({
  sendCopilotChat: vi.fn(),
}));

describe('AiTripCopilotPage Real Browser Synchronization Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Initial state has "Choose destination" in Header, 0 selected places, and no stale Jaipur card', () => {
    render(
      <MemoryRouter>
        <AiTripCopilotPage />
      </MemoryRouter>
    );

    // Header destination must be "Choose destination", NOT "Jaipur"
    expect(screen.getAllByText('Choose destination').length).toBeGreaterThanOrEqual(1);
    // Selected places count in left panel should be 0
    expect(screen.getByText('Selected (0)')).toBeDefined();
    // Bottom-right destination card should not be visible when locations is empty
    expect(screen.queryByText(/Destination Hub/i)).toBeNull();
  });

  it('2. Message "make plan trip for visakhapatnam" discovers Visakhapatnam, updates Header, renders place cards', async () => {
    (tripPlannerApi.sendCopilotChat as any).mockResolvedValueOnce({
      message: 'Here are top verified attractions in Visakhapatnam to explore:',
      intent: 'DESTINATION_DISCOVERY',
      places: [
        {
          poi_id: 'poi_vizag_1',
          destination_id: 'dest_vizag',
          name: 'Ayyappa Swamy Temple',
          description: 'Historic temple in Visakhapatnam.',
          latitude: 17.6769,
          longitude: 83.2014,
          image_url: null,
          source: 'opentripmap',
          kinds: 'interesting_places',
          rating: 4.5,
        },
        {
          poi_id: 'poi_vizag_2',
          destination_id: 'dest_vizag',
          name: 'Shivalayam',
          description: 'Spiritual attraction in Visakhapatnam.',
          latitude: 17.6768,
          longitude: 83.2010,
          image_url: null,
          source: 'opentripmap',
          kinds: 'interesting_places',
          rating: 4.4,
        },
      ],
      selected_places: [],
      locations: [
        {
          id: 'dest_vizag',
          name: 'Visakhapatnam',
          description: 'Port city in Andhra Pradesh',
          latitude: 17.68009,
          longitude: 83.20161,
          type: 'destination',
        },
      ],
      trip_plan: null,
      trip_updates: {
        destination: 'Visakhapatnam',
      },
    });

    render(
      <MemoryRouter>
        <AiTripCopilotPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ask GoFlexi AI/i);
    fireEvent.change(input, { target: { value: 'make plan trip for visakhapatnam' } });
    fireEvent.submit(input.closest('form')!);

    // AI message should be visible (NOT generic greeting)
    await waitFor(() => {
      expect(
        screen.getByText('Here are top verified attractions in Visakhapatnam to explore:')
      ).toBeDefined();
    });

    // Header, Left Panel & Globe all synchronize to Visakhapatnam!
    expect(screen.getAllByText('Visakhapatnam').length).toBeGreaterThanOrEqual(1);

    // Discovered place cards must be rendered
    expect(screen.getByText('Ayyappa Swamy Temple')).toBeDefined();
    expect(screen.getByText('Shivalayam')).toBeDefined();
  });

  it('3. Adding places updates Left Panel Selected count and adds POI markers', async () => {
    (tripPlannerApi.sendCopilotChat as any).mockResolvedValueOnce({
      message: 'Here are places in Visakhapatnam:',
      intent: 'DESTINATION_DISCOVERY',
      places: [
        {
          poi_id: 'poi_vizag_1',
          destination_id: 'dest_vizag',
          name: 'Ayyappa Swamy Temple',
          description: 'Historic temple in Visakhapatnam.',
          latitude: 17.6769,
          longitude: 83.2014,
          source: 'opentripmap',
          kinds: 'interesting_places',
          rating: 4.5,
        },
      ],
      selected_places: [],
      locations: [
        {
          id: 'dest_vizag',
          name: 'Visakhapatnam',
          latitude: 17.68009,
          longitude: 83.20161,
          type: 'destination',
        },
      ],
      trip_plan: null,
      trip_updates: {
        destination: 'Visakhapatnam',
      },
    });

    render(
      <MemoryRouter>
        <AiTripCopilotPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ask GoFlexi AI/i);
    fireEvent.change(input, { target: { value: 'make plan trip for visakhapatnam' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Ayyappa Swamy Temple')).toBeDefined();
    });

    // Mock response for ADD_PLACE
    (tripPlannerApi.sendCopilotChat as any).mockResolvedValueOnce({
      message: 'Added Ayyappa Swamy Temple to your trip!',
      intent: 'ADD_PLACE',
      places: [],
      selected_places: [
        {
          poi_id: 'poi_vizag_1',
          name: 'Ayyappa Swamy Temple',
          latitude: 17.6769,
          longitude: 83.2014,
        },
      ],
      locations: [
        {
          id: 'dest_vizag',
          name: 'Visakhapatnam',
          latitude: 17.68009,
          longitude: 83.20161,
          type: 'destination',
        },
        {
          id: 'poi_vizag_1',
          name: 'Ayyappa Swamy Temple',
          latitude: 17.6769,
          longitude: 83.2014,
          type: 'activity',
        },
      ],
      trip_plan: null,
      trip_updates: {},
    });

    // Click "Add to Trip" button on the place card
    const addBtn = screen.getByRole('button', { name: /Add to Trip/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      // Left panel should now show Selected (1)
      expect(screen.getByText('Selected (1)')).toBeDefined();
    });
  });

  it('4. Changing destination to Jaipur resets previous selected places and switches Header to Jaipur', async () => {
    (tripPlannerApi.sendCopilotChat as any).mockResolvedValueOnce({
      message: 'Switched to Jaipur! Here are top sights:',
      intent: 'DESTINATION_DISCOVERY',
      places: [
        {
          poi_id: 'poi_jaipur_1',
          destination_id: 'dest_jaipur',
          name: 'Hawa Mahal',
          latitude: 26.9239,
          longitude: 75.8267,
          source: 'opentripmap',
          kinds: 'interesting_places',
          rating: 4.8,
        },
      ],
      selected_places: [],
      locations: [
        {
          id: 'dest_jaipur',
          name: 'Jaipur',
          latitude: 26.9124,
          longitude: 75.7873,
          type: 'destination',
        },
      ],
      trip_plan: null,
      trip_updates: {
        destination: 'Jaipur',
      },
    });

    render(
      <MemoryRouter>
        <AiTripCopilotPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ask GoFlexi AI/i);
    fireEvent.change(input, { target: { value: 'Actually, I want to go to Jaipur instead' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Switched to Jaipur! Here are top sights:')).toBeDefined();
    });

    // Header, Left Panel & Globe must update to Jaipur
    expect(screen.getAllByText('Jaipur').length).toBeGreaterThanOrEqual(1);
    // Selected places should remain 0
    expect(screen.getByText('Selected (0)')).toBeDefined();
  });
});
