import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventsPage, RaceEvent } from '../models/event.model';

const API_BASE = 'http://localhost:8080';

// Spring Boot returns a Page object; some endpoints return a plain array.
type SpringResponse<T> =
  | { content: T[]; totalElements: number; number: number; size: number }
  | T[];

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  getEvents(page: number, limit: number, search = ''): Observable<EventsPage> {
    let params = new HttpParams()
      .set('page', page - 1) // Spring Boot uses 0-indexed pages
      .set('size', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<SpringResponse<RaceEvent>>(`${API_BASE}/api/v1/catalog/events`, { params })
      .pipe(
        map(resp => {
          if (Array.isArray(resp)) {
            // Backend returned a flat array — paginate client-side.
            const start = (page - 1) * limit;
            return { data: resp.slice(start, start + limit), total: resp.length, page, limit };
          }
          return { data: resp.content, total: resp.totalElements, page, limit };
        }),
      );
  }

  publishEvent(eventId: string): Observable<unknown> {
    return this.http.patch(
      `${API_BASE}/api/v1/catalog/events/${eventId}/status`,
      { status: 'PUBLISHED' },
    );
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
