export type EventStatus = 'DRAFT' | 'PUBLISHED';

export interface RaceEvent {
  id: string;
  name: string;
  raceDate: string;
  city: string;
  status: EventStatus;
  registeredAthletes?: number;
}

export interface EventsPage {
  data: RaceEvent[];
  total: number;
  page: number;
  limit: number;
}
