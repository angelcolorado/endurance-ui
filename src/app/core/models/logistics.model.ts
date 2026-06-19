import { DistanceCategory } from '../../features/events/pages/event-create/event-create.component';

// ── Corral detail ─────────────────────────────────────────────────────────────

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

// Kept for getCorrals() backward compatibility
export interface CorralsResponse {
  eventId?: string;
  eventName?: string;
  corralsByDistance: Partial<Record<DistanceCategory, CorralDetail[]>>;
}

// ── Lifecycle status ──────────────────────────────────────────────────────────

export type LogisticsEventStatus =
  | 'CONFIGURATION_PHASE'
  | 'READY_FOR_ALLOCATION'
  | 'ALLOCATION_IN_PROGRESS'
  | 'ALLOCATION_COMPLETED'
  | 'EXECUTION_PHASE'
  | 'ARCHIVED';

export interface StatusMeta {
  label: string;
  classes: string;
  pulse: boolean;
}

export const STATUS_META: Record<LogisticsEventStatus, StatusMeta> = {
  CONFIGURATION_PHASE:    { label: 'Configurando',        classes: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',          pulse: false },
  READY_FOR_ALLOCATION:   { label: 'Listo para Asignar',  classes: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30',          pulse: false },
  ALLOCATION_IN_PROGRESS: { label: 'Asignando...',        classes: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',       pulse: true  },
  ALLOCATION_COMPLETED:   { label: 'Asignación Completa', classes: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', pulse: false },
  EXECUTION_PHASE:        { label: 'En Ejecución',        classes: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',    pulse: false },
  ARCHIVED:               { label: 'Archivado',           classes: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',       pulse: false },
};

// ── Event offering ────────────────────────────────────────────────────────────

export interface EventOffering {
  distance: DistanceCategory;
  modality: 'INDIVIDUAL' | 'RELAY';
  teamSize: number;
}

// ── Logistics event detail (GET /api/v1/logistics/events/:id) ─────────────────

export interface LogisticsEventDetail {
  eventId: string;
  name: string;
  raceDate: string;
  offerings: EventOffering[];
  isRelay: boolean;
  corralConfigurations: CorralDetail[];
  status: LogisticsEventStatus;
  contractedPacers: string[];
  openCorral: boolean;
}

// ── Logistics event summary (list view) ──────────────────────────────────────

export interface LogisticsEventSummary {
  eventId: string;
  name: string;
  raceDate: string;
  status: LogisticsEventStatus;
  openCorral: boolean;
}

// ── Generic Spring Page wrapper ───────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed
  size: number;
}
