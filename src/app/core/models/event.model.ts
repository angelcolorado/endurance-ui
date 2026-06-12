export type EventStatus = 'Active' | 'Upcoming' | 'Completed' | 'Cancelled';

export interface RaceEvent {
  id: string;
  name: string;
  date: string;
  registeredAthletes: number;
  status: EventStatus;
}

export interface EventsPage {
  data: RaceEvent[];
  total: number;
  page: number;
  limit: number;
}
