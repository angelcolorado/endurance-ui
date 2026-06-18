import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CorralsResponse, LogisticsEventSummary, Page } from '../models/logistics.model';

const API_BASE = 'http://localhost:8080';

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

  getCorrals(eventId: string): Observable<CorralsResponse> {
    return this.http.get<CorralsResponse>(
      `${API_BASE}/api/v1/events/${eventId}/corrals`,
    );
  }
}
