import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { LogisticsService } from '../../../../core/services/logistics.service';
import { LogisticsEventSummary, LogisticsEventStatus, Page } from '../../../../core/models/logistics.model';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: Page<LogisticsEventSummary> }
  | { status: 'error'; message: string };

export interface StatusMeta {
  label: string;
  classes: string;
  pulse: boolean;
}

export const STATUS_META: Record<LogisticsEventStatus, StatusMeta> = {
  CONFIGURATION_PHASE:    { label: 'Configurando',        classes: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',     pulse: false },
  READY_FOR_ALLOCATION:   { label: 'Listo para Asignar',  classes: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30',     pulse: false },
  ALLOCATION_IN_PROGRESS: { label: 'Asignando...',        classes: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',  pulse: true  },
  ALLOCATION_COMPLETED:   { label: 'Asignación Completa', classes: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', pulse: false },
  EXECUTION_PHASE:        { label: 'En Ejecución',        classes: 'bg-violet-500/15 text-violet-400 ring-violet-500/30', pulse: false },
  ARCHIVED:               { label: 'Archivado',           classes: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',  pulse: false },
};

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
