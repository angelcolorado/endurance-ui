import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { CorralsResponse, LogisticsEventDetail, LogisticsEventSummary, Page } from '../models/logistics.model';

const API_BASE = 'http://localhost:8080';

function timeToSeconds(timeString: string): number | null {
  if (!timeString?.trim()) return null;
  const parts = timeString.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  if ([h, m, s].some(n => isNaN(n)) || m > 59 || s > 59 || h < 0) return null;
  return h * 3600 + m * 60 + s;
}

/**
 * Converts 'HH:mm' or 'HH:mm:ss' to an ISO 8601 duration (e.g. 'PT5400S').
 * Returns null for empty, invalid format, or out-of-range values.
 */
export function timeStringToIso8601(timeString: string): string | null {
  const seconds = timeToSeconds(timeString);
  return seconds !== null ? `PT${seconds}S` : null;
}

/**
 * Converts an ISO 8601 duration (e.g. "PT10800S", "PT5400S") to a human-readable
 * time string (e.g. "3:00h", "1:30h"). Returns '--' for null, empty, or "PT0S".
 */
export function parseIsoDuration(duration: string | null | undefined): string {
  if (!duration || duration === 'PT0S') return '--';

  // Supports PT<n>S, PT<n>M, PT<n>H and combinations like PT1H30M
  const hoursMatch   = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);

  let totalSeconds = 0;
  if (hoursMatch)   totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);

  if (totalSeconds === 0) return '--';

  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${h}:${pad(m)}h`;
}

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
