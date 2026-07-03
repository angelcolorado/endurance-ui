import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { CorralsResponse, LogisticsEventDetail, LogisticsEventSummary, Page } from '../models/logistics.model';
import { parseIsoDuration, timeStringToIso8601 } from '../utils/time.utils';

export { parseIsoDuration, timeStringToIso8601 };

const API_BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  private readonly http = inject(HttpClient);

  getLogisticsEvents(page = 0, size = 20): Observable<Page<LogisticsEventSummary>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<LogisticsEventSummary>>(
      `${API_BASE}/api/v1/logistics/events`,
      { params },
    );
  }

  getEventDetails(eventId: string): Observable<LogisticsEventDetail> {
    return this.http.get<LogisticsEventDetail>(
      `${API_BASE}/api/v1/logistics/events/${eventId}`,
    );
  }

  getCorrals(eventId: string): Observable<CorralsResponse> {
    return this.http.get<CorralsResponse>(
      `${API_BASE}/api/v1/logistics/events/${eventId}/corrals`,
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of({ corralsByDistance: {} } as CorralsResponse);
        }
        return throwError(() => error);
      }),
    );
  }
}
