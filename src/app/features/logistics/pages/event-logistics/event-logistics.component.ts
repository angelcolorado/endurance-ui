import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';
import { LogisticsService } from '../../../../core/services/logistics.service';
import { LogisticsEventDetail, StatusMeta, STATUS_META } from '../../../../core/models/logistics.model';
import { CorralCardComponent } from '../../components/corral-card/corral-card.component';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: LogisticsEventDetail }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-event-logistics',
  standalone: true,
  imports: [CorralCardComponent],
  templateUrl: './event-logistics.component.html',
})
export class EventLogisticsComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly logisticsService = inject(LogisticsService);

  readonly state = signal<PageState>({ status: 'loading' });

  constructor() {
    this.route.paramMap.pipe(
      tap(() => this.state.set({ status: 'loading' })),
      switchMap(params => {
        const eventId = params.get('eventId') ?? '';
        return this.logisticsService.getEventDetails(eventId).pipe(
          catchError(() => {
            this.state.set({ status: 'error', message: 'Failed to load event details. Please try again.' });
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(data => this.state.set({ status: 'loaded', data }));
  }

  getStatusMeta(status: keyof typeof STATUS_META): StatusMeta {
    return STATUS_META[status];
  }
}
