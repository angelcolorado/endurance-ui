import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { LogisticsService } from '../../../../core/services/logistics.service';
import {
  LogisticsEventSummary, LogisticsEventStatus,
  StatusMeta, STATUS_META, Page,
} from '../../../../core/models/logistics.model';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: Page<LogisticsEventSummary> }
  | { status: 'error'; message: string };

export { STATUS_META };

@Component({
  selector: 'app-logistics-event-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './logistics-event-list.component.html',
})
export class LogisticsEventListComponent {
  private readonly logisticsService = inject(LogisticsService);

  readonly state = signal<PageState>({ status: 'loading' });
  readonly statusMeta = STATUS_META;

  constructor() {
    this.logisticsService.getLogisticsEvents().pipe(
      catchError(() => {
        this.state.set({ status: 'error', message: 'Failed to load logistics events. Please try again.' });
        return EMPTY;
      }),
      takeUntilDestroyed(),
    ).subscribe(data => this.state.set({ status: 'loaded', data }));
  }

  getStatusMeta(status: LogisticsEventStatus): StatusMeta {
    return STATUS_META[status];
  }
}
