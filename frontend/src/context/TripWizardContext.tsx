import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  GeoResult,
  BudgetPreview,
  WizardActivity,
  DateInsight,
  TripPlan,
} from '../types/trip-planner';
import { FlightOption, HotelOption, TrainOption } from '../types/travel-search';

export interface TripWizardState {
  step: number;
  totalSteps: number;
  destination: string;
  destinationGeo: GeoResult | null;
  departureCity: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  travelersType: string;
  budgetMin: number;
  budgetMax: number;
  budgetPreview: BudgetPreview | null;
  activities: WizardActivity[];
  travelStyle: string;
  transportMode: 'flight' | 'train';
  selectedFlight: FlightOption | null;
  selectedTrain: TrainOption | null;
  selectedHotel: HotelOption | null;
  generatedTripPlan: TripPlan | null;
  dateInsight: DateInsight | null;
}

type TripWizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_DESTINATION'; payload: { destination: string; geo?: GeoResult | null } }
  | { type: 'SET_DESTINATION_GEO'; payload: GeoResult | null }
  | { type: 'SET_DEPARTURE_CITY'; payload: string }
  | { type: 'SET_DATES'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_TRAVELERS'; payload: { count: number; type?: string } }
  | { type: 'SET_BUDGET_RANGE'; payload: { min: number; max: number } }
  | { type: 'SET_BUDGET_PREVIEW'; payload: BudgetPreview | null }
  | { type: 'ADD_ACTIVITY'; payload: WizardActivity }
  | { type: 'REMOVE_ACTIVITY'; payload: string }
  | { type: 'TOGGLE_ACTIVITY'; payload: WizardActivity }
  | { type: 'SET_TRAVEL_STYLE'; payload: string }
  | { type: 'SET_TRANSPORT_MODE'; payload: 'flight' | 'train' }
  | { type: 'SET_SELECTED_FLIGHT'; payload: FlightOption | null }
  | { type: 'SET_SELECTED_TRAIN'; payload: TrainOption | null }
  | { type: 'SET_SELECTED_HOTEL'; payload: HotelOption | null }
  | { type: 'SET_GENERATED_TRIP_PLAN'; payload: TripPlan | null }
  | { type: 'SET_DATE_INSIGHT'; payload: DateInsight | null }
  | { type: 'RESET_WIZARD' };

const initialState: TripWizardState = {
  step: 1,
  totalSteps: 8,
  destination: 'Goa',
  destinationGeo: {
    name: 'Goa',
    country: 'India',
    admin1: 'Goa',
    latitude: 15.2993,
    longitude: 74.1240,
    country_code: 'IN',
  },
  departureCity: 'Mumbai',
  startDate: '2026-10-15',
  endDate: '2026-10-19',
  travelersCount: 2,
  travelersType: 'Couple / Pair',
  budgetMin: 15000,
  budgetMax: 50000,
  budgetPreview: null,
  activities: [],
  travelStyle: 'Balanced',
  transportMode: 'flight',
  selectedFlight: null,
  selectedTrain: null,
  selectedHotel: null,
  generatedTripPlan: null,
  dateInsight: null,
};

function tripWizardReducer(state: TripWizardState, action: TripWizardAction): TripWizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: Math.max(1, Math.min(action.payload, state.totalSteps)) };
    case 'SET_DESTINATION': {
      const isNew = action.payload.destination.trim().toLowerCase() !== state.destination.trim().toLowerCase();
      return {
        ...state,
        destination: action.payload.destination,
        destinationGeo: action.payload.geo !== undefined ? action.payload.geo : state.destinationGeo,
        activities: isNew ? [] : state.activities,
        budgetPreview: isNew ? null : state.budgetPreview,
        dateInsight: isNew ? null : state.dateInsight,
        selectedFlight: isNew ? null : state.selectedFlight,
        selectedTrain: isNew ? null : state.selectedTrain,
        selectedHotel: isNew ? null : state.selectedHotel,
        generatedTripPlan: isNew ? null : state.generatedTripPlan,
      };
    }
    case 'SET_DESTINATION_GEO':
      return { ...state, destinationGeo: action.payload };
    case 'SET_DEPARTURE_CITY':
      return { ...state, departureCity: action.payload };
    case 'SET_DATES':
      return { ...state, startDate: action.payload.startDate, endDate: action.payload.endDate };
    case 'SET_TRAVELERS':
      return {
        ...state,
        travelersCount: action.payload.count,
        travelersType: action.payload.type || state.travelersType,
      };
    case 'SET_BUDGET_RANGE':
      return { ...state, budgetMin: action.payload.min, budgetMax: action.payload.max };
    case 'SET_BUDGET_PREVIEW':
      return {
        ...state,
        budgetPreview: action.payload,
        budgetMin: action.payload ? action.payload.min_price : state.budgetMin,
        budgetMax: action.payload ? action.payload.max_price : state.budgetMax,
      };
    case 'ADD_ACTIVITY': {
      if (state.activities.some((a) => a.xid === action.payload.xid || a.name === action.payload.name)) {
        return state;
      }
      return { ...state, activities: [...state.activities, action.payload] };
    }
    case 'REMOVE_ACTIVITY':
      return { ...state, activities: state.activities.filter((a) => a.xid !== action.payload) };
    case 'TOGGLE_ACTIVITY': {
      const exists = state.activities.some(
        (a) => a.xid === action.payload.xid || a.name === action.payload.name
      );
      if (exists) {
        return {
          ...state,
          activities: state.activities.filter(
            (a) => a.xid !== action.payload.xid && a.name !== action.payload.name
          ),
        };
      }
      return { ...state, activities: [...state.activities, action.payload] };
    }
    case 'SET_TRAVEL_STYLE':
      return { ...state, travelStyle: action.payload };
    case 'SET_TRANSPORT_MODE':
      return { ...state, transportMode: action.payload };
    case 'SET_SELECTED_FLIGHT':
      return { ...state, selectedFlight: action.payload };
    case 'SET_SELECTED_TRAIN':
      return { ...state, selectedTrain: action.payload };
    case 'SET_SELECTED_HOTEL':
      return { ...state, selectedHotel: action.payload };
    case 'SET_GENERATED_TRIP_PLAN':
      return { ...state, generatedTripPlan: action.payload };
    case 'SET_DATE_INSIGHT':
      return { ...state, dateInsight: action.payload };
    case 'RESET_WIZARD':
      return { ...initialState };
    default:
      return state;
  }
}

interface TripWizardContextType extends TripWizardState {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDestination: (destination: string, geo?: GeoResult | null) => void;
  setDestinationGeo: (geo: GeoResult | null) => void;
  setDepartureCity: (city: string) => void;
  setDates: (startDate: string, endDate: string) => void;
  setTravelers: (count: number, type?: string) => void;
  setBudgetRange: (min: number, max: number) => void;
  setBudgetPreview: (preview: BudgetPreview | null) => void;
  addActivity: (activity: WizardActivity) => void;
  removeActivity: (xid: string) => void;
  toggleActivity: (activity: WizardActivity) => void;
  setTravelStyle: (style: string) => void;
  setTransportMode: (mode: 'flight' | 'train') => void;
  setSelectedFlight: (flight: FlightOption | null) => void;
  setSelectedTrain: (train: TrainOption | null) => void;
  setSelectedHotel: (hotel: HotelOption | null) => void;
  setGeneratedTripPlan: (plan: TripPlan | null) => void;
  setDateInsight: (insight: DateInsight | null) => void;
  resetWizard: () => void;
}

const TripWizardContext = createContext<TripWizardContextType | null>(null);

export const TripWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tripWizardReducer, initialState);

  const setStep = (step: number) => dispatch({ type: 'SET_STEP', payload: step });
  const nextStep = () => dispatch({ type: 'SET_STEP', payload: state.step + 1 });
  const prevStep = () => dispatch({ type: 'SET_STEP', payload: state.step - 1 });
  const setDestination = (destination: string, geo?: GeoResult | null) =>
    dispatch({ type: 'SET_DESTINATION', payload: { destination, geo } });
  const setDestinationGeo = (geo: GeoResult | null) =>
    dispatch({ type: 'SET_DESTINATION_GEO', payload: geo });
  const setDepartureCity = (city: string) =>
    dispatch({ type: 'SET_DEPARTURE_CITY', payload: city });
  const setDates = (startDate: string, endDate: string) =>
    dispatch({ type: 'SET_DATES', payload: { startDate, endDate } });
  const setTravelers = (count: number, type?: string) =>
    dispatch({ type: 'SET_TRAVELERS', payload: { count, type } });
  const setBudgetRange = (min: number, max: number) =>
    dispatch({ type: 'SET_BUDGET_RANGE', payload: { min, max } });
  const setBudgetPreview = (preview: BudgetPreview | null) =>
    dispatch({ type: 'SET_BUDGET_PREVIEW', payload: preview });
  const addActivity = (activity: WizardActivity) =>
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });
  const removeActivity = (xid: string) =>
    dispatch({ type: 'REMOVE_ACTIVITY', payload: xid });
  const toggleActivity = (activity: WizardActivity) =>
    dispatch({ type: 'TOGGLE_ACTIVITY', payload: activity });
  const setTravelStyle = (style: string) =>
    dispatch({ type: 'SET_TRAVEL_STYLE', payload: style });
  const setTransportMode = (mode: 'flight' | 'train') =>
    dispatch({ type: 'SET_TRANSPORT_MODE', payload: mode });
  const setSelectedFlight = (flight: FlightOption | null) =>
    dispatch({ type: 'SET_SELECTED_FLIGHT', payload: flight });
  const setSelectedTrain = (train: TrainOption | null) =>
    dispatch({ type: 'SET_SELECTED_TRAIN', payload: train });
  const setSelectedHotel = (hotel: HotelOption | null) =>
    dispatch({ type: 'SET_SELECTED_HOTEL', payload: hotel });
  const setGeneratedTripPlan = (plan: TripPlan | null) =>
    dispatch({ type: 'SET_GENERATED_TRIP_PLAN', payload: plan });
  const setDateInsight = (insight: DateInsight | null) =>
    dispatch({ type: 'SET_DATE_INSIGHT', payload: insight });
  const resetWizard = () => dispatch({ type: 'RESET_WIZARD' });

  return (
    <TripWizardContext.Provider
      value={{
        ...state,
        setStep,
        nextStep,
        prevStep,
        setDestination,
        setDestinationGeo,
        setDepartureCity,
        setDates,
        setTravelers,
        setBudgetRange,
        setBudgetPreview,
        addActivity,
        removeActivity,
        toggleActivity,
        setTravelStyle,
        setTransportMode,
        setSelectedFlight,
        setSelectedTrain,
        setSelectedHotel,
        setGeneratedTripPlan,
        setDateInsight,
        resetWizard,
      }}
    >
      {children}
    </TripWizardContext.Provider>
  );
};

export const useTripWizard = (): TripWizardContextType => {
  const context = useContext(TripWizardContext);
  if (!context) {
    throw new Error('useTripWizard must be used within a TripWizardProvider');
  }
  return context;
};
