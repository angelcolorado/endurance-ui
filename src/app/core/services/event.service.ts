import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { EventsPage, RaceEvent } from '../models/event.model';

const API_BASE = 'http://localhost:8080';

const MOCK_EVENTS: RaceEvent[] = [
  { id: '1',  name: 'EnduranceOps Monterrey 2026',      date: '2026-06-28', registeredAthletes: 3200, status: 'Active'    },
  { id: '2',  name: 'Trail Ultra Bajío',                 date: '2026-07-12', registeredAthletes: 1850, status: 'Upcoming'  },
  { id: '3',  name: 'Marathon CDMX Classic',             date: '2026-08-03', registeredAthletes: 7400, status: 'Upcoming'  },
  { id: '4',  name: 'Ironman Cancún 70.3',               date: '2026-08-17', registeredAthletes: 2100, status: 'Upcoming'  },
  { id: '5',  name: 'Ultra Desierto Sonora',             date: '2026-09-05', registeredAthletes:  980, status: 'Upcoming'  },
  { id: '6',  name: 'Ruta de los Volcanes',              date: '2026-09-20', registeredAthletes: 1450, status: 'Upcoming'  },
  { id: '7',  name: 'Maratón Guadalajara International', date: '2026-10-11', registeredAthletes: 5300, status: 'Upcoming'  },
  { id: '8',  name: 'Coastal Ultra Veracruz',            date: '2026-10-25', registeredAthletes: 1100, status: 'Upcoming'  },
  { id: '9',  name: 'EnduranceOps Puebla Spring',        date: '2026-03-15', registeredAthletes: 2900, status: 'Completed' },
  { id: '10', name: 'Night Run CDMX',                    date: '2026-04-06', registeredAthletes: 3800, status: 'Completed' },
  { id: '11', name: 'Chihuahua Mountain 50K',            date: '2026-04-20', registeredAthletes:  720, status: 'Completed' },
  { id: '12', name: 'Baja Desert Challenge',             date: '2026-05-10', registeredAthletes:  540, status: 'Cancelled' },
];

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  getEvents(page: number, limit: number, search = ''): Observable<EventsPage> {
    const term = search.toLowerCase().trim();
    const filtered = term
      ? MOCK_EVENTS.filter((e) => e.name.toLowerCase().includes(term))
      : MOCK_EVENTS;

    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return of({ data, total: filtered.length, page, limit }).pipe(delay(800));
  }

  createCatalogEntry(file: File, data: Record<string, unknown>): Observable<unknown> {
    const payload = { ...data, documentVersion: '1.0' };
    const formData = new FormData();
    formData.append('document', file);
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    // Do NOT set Content-Type manually — the browser must set it with the multipart boundary.
    return this.http.post(`${API_BASE}/api/v1/catalog/events`, formData);
  }
}
