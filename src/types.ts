export type SemaphoreStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface Driver {
  id: string;
  name: string;
  nickname: string;
  vehicleModel: string;
  plate: string;
  active: boolean;
  avatar: string;
  targetHourlyRate: number; // e.g. 45 R$/h
}

export interface VehicleConfig {
  id: string;
  driverId: string;
  structuralCostPerKm: number; // Default R$ 2.30 / km (manutenção, depreciação, pneus, óleo, seguro)
  fuelType: 'ethanol' | 'gasoline' | 'cng';
  fuelConsumptionKmPerLiter: number; // Default 9.0 km/l
  fuelPricePerLiter: number; // e.g. R$ 3.85 / l
  // Computed values
  fuelCostPerKm: number;
  totalCostPerKm: number;
}

export interface RegionZone {
  id: string;
  name: string;
  city: 'Sorocaba' | 'Votorantim';
  center: { lat: number; lng: number };
  radiusKm: number;
  currentTraffic: 'low' | 'moderate' | 'heavy' | 'intense';
  historicalScore: number; // 0 - 100
  currentDemandScore: number; // 0 - 100
  typicalWaitMinutes: number;
  surgeObserved: number; // Adicional em R$
  description: string;
  strategicStops: StrategicStop[];
}

export interface StrategicStop {
  id: string;
  name: string;
  category: 'posto_24h' | 'shopping' | 'praca_segura' | 'hipermercado' | 'estacionamento';
  address: string;
  lat: number;
  lng: number;
  hasRestroom: boolean;
  hasCoffee: boolean;
  is24h: boolean;
  notes: string;
}

export interface Shift {
  id: string;
  driverId: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  isActive: boolean;
  kmTotal: number;
  kmProductive: number;
  kmEmpty: number;
  minutesMoving: number;
  minutesParked: number;
  tripsCount: number;
  grossRevenue: number;
  calculatedCost: number;
  netMargin: number;
  zonesVisited: string[];
}

export interface TripOffer {
  id: string;
  driverId: string;
  timestamp: string;
  fareValue: number; // R$
  pickupDistanceKm: number; // km até passageiro
  tripDistanceKm: number; // km da corrida
  estimatedDurationMin: number; // minutos
  observedSurge: number; // R$ dinâmico/adicional
  pickupArea: string;
  destinationArea: string;
  source: 'MANUAL' | 'SCREENSHOT';
  
  // Computed Metrics
  totalDistanceKm: number; // pickup + trip
  grossPerKm: number; // fare / totalDistance
  grossPerHour: number; // fare / (minutes / 60)
  estimatedCost: number; // totalDistance * totalCostPerKm
  estimatedNetMargin: number; // fare - estimatedCost
  semaphore: SemaphoreStatus;
  score: number; // 0 - 100
  recommendationReason: string;
  destinationQuality: 'favoravel' | 'neutro' | 'desfavoravel';
  accepted?: boolean;
}

export interface DemandObservation {
  id: string;
  driverId: string;
  timestamp: string;
  city: 'Sorocaba' | 'Votorantim';
  neighborhood: string;
  lat: number;
  lng: number;
  surgeMultiplier?: number;
  surgeValueBonus: number; // +R$
  estimatedWaitTimeMin: number;
  confidence: 'muito_baixa' | 'baixa' | 'moderada' | 'alta';
  source: 'UBER_OBSERVED_BY_USER' | 'HISTORICO_BANCO' | 'GOOGLE_TRAFFIC' | 'AI_PREDICTION';
  notes: string;
}

export interface PositioningRecommendation {
  rank: number;
  region: RegionZone;
  score: number; // 0 - 100
  semaphore: SemaphoreStatus;
  distanceKm: number;
  travelTimeMin: number;
  trafficState: string;
  confidence: 'muito_baixa' | 'baixa' | 'moderada' | 'alta';
  recommendationType: 'PERMANECER' | 'POSICIONAR' | 'NAO_IR';
  reasoning: string;
  dataSources: {
    googleTraffic: boolean;
    userObservationsCount: number;
    historicalRecordsCount: number;
    driverDistanceKm: number;
  };
}

export interface SystemSettings {
  minNetMarginPercentage: number; // e.g. 35%
  maxEmptyKmPercentage: number; // e.g. 25%
  scoreGreenThreshold: number; // default 75
  scoreYellowThreshold: number; // default 55
  maxDynamicChaseDistanceKm: number; // default 2.5 km (não correr atrás de dinâmico longe)
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  contextData?: {
    region?: string;
    semaphore?: SemaphoreStatus;
    sources?: string[];
  };
}
