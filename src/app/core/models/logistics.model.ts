import { DistanceCategory } from '../../features/events/pages/event-create/event-create.component';

// ── Corral detail ────────────────────────────────────────────────────────────

export interface CorralDetail {
  corralId: string;
  corralName: string;
  order: number;
  minTime: string | null; // ISO 8601 duration, e.g. "PT10800S"
  maxTime: string | null;
  maxCapacity: number;
  registeredCount: number;
  isParaAthleteCorral: boolean;
  isRestricted: boolean;
}

export interface CorralsResponse {
  eventId: string;
  eventName: string;
  corralsByDistance: Partial<Record<DistanceCategory, CorralDetail[]>>;
}

// ── Logistics event lifecycle ────────────────────────────────────────────────

export type LogisticsEventStatus =
  | 'CONFIGURATION_PHASE'
  | 'READY_FOR_ALLOCATION'
  | 'ALLOCATION_IN_PROGRESS'
  | 'ALLOCATION_COMPLETED'
  | 'EXECUTION_PHASE'
  | 'ARCHIVED';

export interface LogisticsEventSummary {
  eventId: string;
  name: string;
  raceDate: string;
  status: LogisticsEventStatus;
  openCorral: boolean;
}

// Generic Spring Page wrapper — shared across services
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed
  size: number;
}
