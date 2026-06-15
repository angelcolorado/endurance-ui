import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { EventService } from '../../../../core/services/event.service';

export type DistanceCategory = 'FIVE_K' | 'TEN_K' | 'HALF_MARATHON' | 'MARATHON' | 'ULTRA';
export type OfferingModality = 'INDIVIDUAL' | 'RELAY';

export const DISTANCE_CATEGORIES: DistanceCategory[] = [
  'FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'ULTRA',
];

export const OFFERING_MODALITIES: OfferingModality[] = ['INDIVIDUAL', 'RELAY'];

export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  // Append time to avoid UTC offset shifting the date by one day in some timezones
  const selected = new Date(control.value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today ? null : { pastDate: true };
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './event-create.component.html',
})
export class EventCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly isLoading = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  readonly distanceCategories = DISTANCE_CATEGORIES;
  readonly offeringModalities = OFFERING_MODALITIES;

  selectedFile: File | null = null;

  readonly form = this.fb.group({
    name:                        ['', [Validators.required, Validators.minLength(5)]],
    description:                 ['', Validators.required],
    raceDate:                    ['', [Validators.required, futureDateValidator]],
    city:                        ['', Validators.required],
    issuingAuthority:            ['', Validators.required],
    convocatoriaPublicationDate: ['', Validators.required],
    offerings: this.fb.array([this.buildOffering()]),
    tiers: this.fb.array([
      this.fb.group({
        name:      ['Early Bird', Validators.required],
        startDate: ['2026-01-01', Validators.required],
        endDate:   ['2026-03-31', Validators.required],
        price:     [800.00 as number | null, [Validators.required, Validators.min(0)]],
      }),
    ]),
  });

  get offerings(): FormArray  { return this.form.controls.offerings; }
  get tiers(): FormArray      { return this.form.controls.tiers; }
  get firstTier(): FormGroup  { return this.tiers.at(0) as FormGroup; }

  buildOffering(
    distance: DistanceCategory = 'MARATHON',
    modality: OfferingModality = 'INDIVIDUAL',
    teamSize = 1,
  ): FormGroup {
    return this.fb.group({
      distance: [distance, Validators.required],
      modality: [modality, Validators.required],
      teamSize: [teamSize as number | null, [Validators.required, Validators.min(1)]],
    });
  }

  addOffering(): void {
    this.offerings.push(this.buildOffering());
  }

  removeOffering(index: number): void {
    if (this.offerings.length > 1) {
      this.offerings.removeAt(index);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.fileError.set(file ? null : 'Please attach a PDF document.');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    if (!this.selectedFile) {
      this.fileError.set('Please attach a PDF document.');
      return;
    }

    this.isLoading.set(true);
    this.submitError.set(null);

    this.eventService
      .createCatalogEntry(this.selectedFile, this.form.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/events']),
        error: () => this.submitError.set('Failed to create the event. Please try again.'),
      });
  }
}
