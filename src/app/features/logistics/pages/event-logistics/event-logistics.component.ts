import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LogisticsService } from '../../../../core/services/logistics.service';
import { checkTimeOverlap, timeToSeconds, timeStringToIso8601 } from '../../../../core/utils/time.utils';
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

export const timeRangeValidator: ValidatorFn = (group: AbstractControl) => {
  const min = group.get('minTime')?.value as string | null;
  const max = group.get('maxTime')?.value as string | null;
  if (!min?.trim() || !max?.trim()) return null;
  const minSec = timeToSeconds(min);
  const maxSec = timeToSeconds(max);
  if (minSec === null || maxSec === null) return null;
  return minSec >= maxSec ? { timeRangeInvalid: true } : null;
};

@Component({
  selector: 'app-event-logistics',
  standalone: true,
  imports: [CorralCardComponent, DragDropModule, ReactiveFormsModule],
  templateUrl: './event-logistics.component.html',
})
export class EventLogisticsComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly logisticsService = inject(LogisticsService);
  private readonly fb               = inject(FormBuilder);

  readonly state           = signal<PageState>({ status: 'loading' });
  readonly corrals         = signal<CorralDetail[]>([]);
  readonly hasAnyCorrals   = computed(() => this.corrals().length > 0);
  readonly isSidePanelOpen = signal(false);

  readonly corralForm = this.fb.group(
    {
      name:            ['', Validators.required],
      minTime:         [''],
      maxTime:         [''],
      maxCapacity:     [0, [Validators.required, Validators.min(0)]],
      isParaAthlete:   [false],
      isRestricted:    [false],
      maleBaseTime:    [''],
      femaleBaseTime:  [''],
    },
    { validators: timeRangeValidator },
  );

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

  openPanel(): void {
    this.corralForm.reset({
      name: '', minTime: '', maxTime: '',
      maxCapacity: 0, isParaAthlete: false, isRestricted: false,
      maleBaseTime: '', femaleBaseTime: '',
    });
    this.isSidePanelOpen.set(true);
  }

  closePanel(): void {
    this.isSidePanelOpen.set(false);
  }

  onSubmit(): void {
    if (this.corralForm.invalid) return;

    const { name, minTime, maxTime, maxCapacity, isParaAthlete, isRestricted,
            maleBaseTime, femaleBaseTime } = this.corralForm.getRawValue();

    const newMinSec = minTime ? timeToSeconds(minTime) : null;
    const newMaxSec = maxTime ? timeToSeconds(maxTime) : null;

    if (newMinSec !== null && newMaxSec !== null &&
        checkTimeOverlap(newMinSec, newMaxSec, this.corrals())) {
      this.corralForm.setErrors({ overlap: true });
      return;
    }

    const newCorral: CorralDetail = {
      corralId:            crypto.randomUUID(),
      name:                name!,
      order:               this.corrals().length + 1,
      maleBaseTime:        (maleBaseTime   ? timeStringToIso8601(maleBaseTime)   : null) ?? 'PT0S',
      femaleBaseTime:      (femaleBaseTime ? timeStringToIso8601(femaleBaseTime) : null) ?? 'PT0S',
      minTime:             minTime  ? (timeStringToIso8601(minTime)  ?? null) : null,
      maxTime:             maxTime  ? (timeStringToIso8601(maxTime)  ?? null) : null,
      maxCapacity:         maxCapacity ?? 0,
      isParaAthleteCorral: isParaAthlete ?? false,
      isRestricted:        isRestricted  ?? false,
      assignedPacers:      [],
    };

    this.corrals.update(list => [...list, newCorral]);
    this.closePanel();
  }
}
