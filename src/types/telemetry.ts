export interface TelemetryEvent {
  player_id: string;
  event_type: string;
  timestamp: string;
  day?: number | string; // In-game day number/identifier (e.g. 1, 2, 3...)
  game_day?: number | string;
}

export interface TowerUsage {
  tower: string;
  count: number;
  level: number;
}

export interface MapAttempt {
  player_id: string;
  map_name: string;
  passed: boolean;
  attempts: number;
  rounds: number;
  ram_used: number;
  cpu_used: number;
  duration: number; // nanoseconds from Go backend
  first_time: boolean;
  timestamp: string;
  towers: TowerUsage[];
  day?: number | string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  autoRefreshInterval: number; // in seconds (0 = disabled)
}

export interface EndpointStatus {
  statsLive: boolean;
  statsError?: string;
  statsCount: number;
  mapAttemptsLive: boolean;
  mapAttemptsError?: string;
  mapAttemptsCount: number;
  lastChecked: Date | null;
}

export interface EventFilterState {
  startDate: string | null;
  endDate: string | null;
  selectedEventType: string;
  selectedPlayerId: string;
  searchQuery: string;
}

export interface MapFilterState {
  startDate: string | null;
  endDate: string | null;
  selectedMap: string;
  selectedPlayerId: string;
  searchQuery: string;
}

export type NavView = 
  | 'events-frequency'
  | 'events-vox-populi'
  | 'events-timeline'
  | 'events-players'
  | 'events-raw'
  | 'maps-overview'
  | 'maps-towers'
  | 'maps-raw'
  | 'settings';
