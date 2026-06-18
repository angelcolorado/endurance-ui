import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';
import { LogisticsService } from '../../../../core/services/logistics.service';
import { CorralsResponse, CorralDetail } from '../../../../core/models/logistics.model';
import { CorralCardComponent } from '../../components/corral-card/corral-card.component';
import { DistanceCategory } from '../../../events/pages/event-create/event-create.component';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: CorralsResponse }
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

  // Expose for template iteration
  readonly distanceKeys: DistanceCategory[] = [
    'FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'ULTRA', 'CUSTOM',
  ];

  constructor() {
    this.route.paramMap.pipe(
      tap(() => this.state.set({ status: 'loading' })),
      switchMap(params => {
        const eventId = params.get('eventId') ?? '';
        return this.logisticsService.getCorrals(eventId).pipe(
          catchError(() => {
            this.state.set({ status: 'error', message: 'Failed to load corrals. Please try again.' });
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(data => this.state.set({ status: 'loaded', data }));
  }

  corralsFor(distance: DistanceCategory): CorralDetail[] {
    const s = this.state();
    if (s.status !== 'loaded') return [];
    return s.data.corralsByDistance[distance] ?? [];
  }

  hasAnyCorrals(): boolean {
    return this.distanceKeys.some(d => this.corralsFor(d).length > 0);
  }
}
