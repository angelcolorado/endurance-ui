import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LogisticsService } from '../../../../core/services/logistics.service';
import {
  CorralDetail,
  LogisticsEventDetail,
  StatusMeta,
  STATUS_META,
} from '../../../../core/models/logistics.model';
import { CorralCardComponent } from '../../components/corral-card/corral-card.component';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: LogisticsEventDetail }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-event-logistics',
  standalone: true,
  imports: [CorralCardComponent, DragDropModule],
  templateUrl: './event-logistics.component.html',
})
export class EventLogisticsComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly logisticsService = inject(LogisticsService);

  readonly state   = signal<PageState>({ status: 'loading' });
  // Writable local copy so moveItemInArray updates trigger change detection
  readonly corrals = signal<CorralDetail[]>([]);

  readonly hasAnyCorrals = computed(() => this.corrals().length > 0);

  constructor() {
    this.route.paramMap.pipe(
      tap(() => {
        this.state.set({ status: 'loading' });
        this.corrals.set([]);
      }),
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
    ).subscribe(data => {
      // TODO: Eliminar este mock después de probar la UI interactiva
      /* const mockCorrals: CorralDetail[] = [
        {
          corralId: "SILLAS-VISUALES",
          name: "Sillas de Ruedas y Atletas Visuales",
          maleBaseTime: "PT0S",
          femaleBaseTime: "PT0S",
          minTime: null,
          maxTime: "PT9000S",
          maxCapacity: 150,
          isParaAthleteCorral: true,
          isRestricted: false,
          assignedPacers: []
        },
        {
          corralId: "ELITE",
          name: "Bloque Élite — V <2:25h / F <3:00h",
          maleBaseTime: "PT8700S",
          femaleBaseTime: "PT10800S",
          minTime: "PT7200S",
          maxTime: "PT8700S",
          maxCapacity: 300,
          isParaAthleteCorral: false,
          isRestricted: true,
          assignedPacers: []
        },
        {
          corralId: "BLOQUE-A",
          name: "Bloque A — 3:00h a 3:30h",
          maleBaseTime: "PT12600S",
          femaleBaseTime: "PT14400S",
          minTime: "PT10800S",
          maxTime: "PT12600S",
          maxCapacity: 2000,
          isParaAthleteCorral: false,
          isRestricted: false,
          assignedPacers: [
            "PT11700S",
            "PT12600S"
          ]
        }
      ];

      this.corrals.set(mockCorrals); */
      this.corrals.set([...data.corralConfigurations]);
      this.state.set({ status: 'loaded', data });
    });
  }

  getStatusMeta(status: keyof typeof STATUS_META): StatusMeta {
    return STATUS_META[status];
  }

  onDrop(event: CdkDragDrop<CorralDetail[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.corrals.update(list => {
      const updated = [...list];
      moveItemInArray(updated, event.previousIndex, event.currentIndex);
      return updated;
    });
  }
}
