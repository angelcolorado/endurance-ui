import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { EventLogisticsComponent, timeRangeValidator } from './event-logistics.component';
import { CorralDetail, LogisticsEventDetail } from '../../../../core/models/logistics.model';
import { FormBuilder } from '@angular/forms';

const API_URL = 'http://localhost:8080/api/v1/logistics/events/evt-42';

const CORRAL_A: CorralDetail = {
  corralId: 'c-1', name: 'Corral A', order: 1,
  maleBaseTime: 'PT10800S', femaleBaseTime: 'PT12600S',
  minTime: null, maxTime: 'PT10800S',
  maxCapacity: 500, registeredCount: 320,
  isParaAthleteCorral: false, isRestricted: false,
  assignedPacers: [],
};
const CORRAL_B: CorralDetail = {
  corralId: 'c-2', name: 'Corral B', order: 2,
  maleBaseTime: 'PT12600S', femaleBaseTime: 'PT14400S',
  minTime: 'PT10800S', maxTime: 'PT14400S',
  maxCapacity: 50, registeredCount: 12,
  isParaAthleteCorral: true, isRestricted: false,
  assignedPacers: [],
};

const MOCK_DETAIL: LogisticsEventDetail = {
  eventId: 'evt-42',
  name: 'Test Marathon',
  raceDate: '2026-11-22',
  offerings: [{ distance: 'MARATHON', modality: 'INDIVIDUAL', teamSize: 1 }],
  isRelay: false,
  corralConfigurations: [CORRAL_A, CORRAL_B],
  status: 'CONFIGURATION_PHASE',
  contractedPacers: [],
  openCorral: false,
};

const MOCK_EMPTY: LogisticsEventDetail = { ...MOCK_DETAIL, corralConfigurations: [] };

function buildActivatedRoute(eventId: string) {
  return { paramMap: of(new Map([['eventId', eventId]])) };
}

describe('EventLogisticsComponent', () => {
  let fixture: ComponentFixture<EventLogisticsComponent>;
  let component: EventLogisticsComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLogisticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: buildActivatedRoute('evt-42') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventLogisticsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component).toBeTruthy();
  });

  it('should be in loading state initially', () => {
    expect(component.state().status).toBe('loading');
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
  });

  it('should transition to loaded state after HTTP response', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.state().status).toBe('loaded');
  });

  it('should populate corrals signal from corralConfigurations', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.corrals().length).toBe(2);
    expect(component.corrals()[0].corralId).toBe('c-1');
  });

  it('should set error state on HTTP failure', () => {
    httpMock.expectOne(API_URL).flush('error', { status: 500, statusText: 'Server Error' });
    expect(component.state().status).toBe('error');
  });

  it('should set error state on 404', () => {
    httpMock.expectOne(API_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(component.state().status).toBe('error');
  });

  it('hasAnyCorrals should be true when corrals exist', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.hasAnyCorrals()).toBe(true);
  });

  it('hasAnyCorrals should be false when corralConfigurations is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_EMPTY);
    expect(component.hasAnyCorrals()).toBe(false);
  });

  it('should render event name in header', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('Test Marathon');
  });

  it('should render status badge', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('[aria-label^="Event status:"]'));
    expect(badge?.nativeElement.textContent).toContain('Configurando');
  });

  it('should render one app-corral-card per corral', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('app-corral-card'));
    expect(cards.length).toBe(2);
  });

  it('should render empty state heading when no corrals', () => {
    httpMock.expectOne(API_URL).flush(MOCK_EMPTY);
    fixture.detectChanges();
    const h2 = fixture.debugElement.query(By.css('h2'));
    expect(h2?.nativeElement.textContent).toContain('Comienza a diseñar tu logística');
  });

  it('should render "+ Crear Primer Corral" CTA in empty state', () => {
    httpMock.expectOne(API_URL).flush(MOCK_EMPTY);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(
      By.css('button[aria-label="Create the first corral for this event"]'),
    );
    expect(btn).toBeTruthy();
  });

  it('getStatusMeta should return correct label', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.getStatusMeta('READY_FOR_ALLOCATION').label).toBe('Listo para Asignar');
  });

  // ── onDrop ───────────────────────────────────────────────────────────────

  it('onDrop should reorder the corrals signal', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.corrals()[0].corralId).toBe('c-1');

    const fakeEvent = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<CorralDetail[]>;
    component.onDrop(fakeEvent);

    expect(component.corrals()[0].corralId).toBe('c-2');
    expect(component.corrals()[1].corralId).toBe('c-1');
  });

  it('onDrop should be a no-op when previousIndex equals currentIndex', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const before = [...component.corrals()];
    const fakeEvent = { previousIndex: 0, currentIndex: 0 } as CdkDragDrop<CorralDetail[]>;
    component.onDrop(fakeEvent);
    expect(component.corrals()).toEqual(before);
  });

  // ── Slide-over panel ─────────────────────────────────────────────────────

  it('isSidePanelOpen should be false initially', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.isSidePanelOpen()).toBe(false);
  });

  it('openPanel() should set isSidePanelOpen to true', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    expect(component.isSidePanelOpen()).toBe(true);
  });

  it('closePanel() should set isSidePanelOpen to false', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.closePanel();
    expect(component.isSidePanelOpen()).toBe(false);
  });

  it('openPanel() should reset the form', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.corralForm.patchValue({ name: 'Dirty value', maxCapacity: 999, maleBaseTime: '01:30' });
    component.openPanel();
    expect(component.corralForm.value.name).toBe('');
    expect(component.corralForm.value.maxCapacity).toBe(0);
    expect(component.corralForm.value.maleBaseTime).toBe('');
  });

  it('panel aside should have translate-x-full class when closed', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const aside = fixture.debugElement.query(By.css('aside[aria-modal="true"]'));
    expect(aside.nativeElement.className).toContain('translate-x-full');
  });

  it('panel aside should have translate-x-0 class when open', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    fixture.detectChanges();
    const aside = fixture.debugElement.query(By.css('aside[aria-modal="true"]'));
    expect(aside.nativeElement.className).toContain('translate-x-0');
  });

  // ── Reactive form ────────────────────────────────────────────────────────

  it('corralForm should be invalid when name is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.corralForm.patchValue({ name: '' });
    expect(component.corralForm.invalid).toBe(true);
  });

  it('corralForm should be valid with required fields filled', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 100 });
    expect(component.corralForm.valid).toBe(true);
  });

  it('onSubmit() should close panel when form is valid', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 100 });
    component.onSubmit();
    expect(component.isSidePanelOpen()).toBe(false);
  });

  it('onSubmit() should not close panel when form is invalid', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.corralForm.patchValue({ name: '' });
    component.openPanel();
    component.onSubmit();
    expect(component.isSidePanelOpen()).toBe(true);
  });

  // ── onSubmit() signal mutation ────────────────────────────────────────────

  it('onSubmit() should append a new CorralDetail to the corrals signal', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 200 });
    component.onSubmit();
    expect(component.corrals().length).toBe(countBefore + 1);
  });

  it('onSubmit() should map form name to the new corral name field', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Corral Elite', maxCapacity: 50 });
    component.onSubmit();
    const added = component.corrals().at(-1)!;
    expect(added.name).toBe('Corral Elite');
  });

  it('onSubmit() should convert minTime HH:mm to ISO 8601', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'X', maxCapacity: 0, minTime: '01:30' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.minTime).toBe('PT5400S');
  });

  it('onSubmit() should set null minTime when field is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'X', maxCapacity: 0, minTime: '' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.minTime).toBeNull();
  });

  it('onSubmit() should not mutate signal when form has timeRangeInvalid error', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'X', maxCapacity: 0, minTime: '04:00', maxTime: '02:00' });
    component.onSubmit();
    expect(component.corrals().length).toBe(countBefore);
  });

  it('onSubmit() should convert maleBaseTime to ISO 8601', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 0, maleBaseTime: '03:00' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.maleBaseTime).toBe('PT10800S');
  });

  it('onSubmit() should convert femaleBaseTime to ISO 8601', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 0, femaleBaseTime: '03:30' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.femaleBaseTime).toBe('PT12600S');
  });

  it('onSubmit() should default maleBaseTime to "PT0S" when field is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 0, maleBaseTime: '' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.maleBaseTime).toBe('PT0S');
  });

  it('onSubmit() should default femaleBaseTime to "PT0S" when field is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.openPanel();
    component.corralForm.patchValue({ name: 'Elite', maxCapacity: 0, femaleBaseTime: '' });
    component.onSubmit();
    expect(component.corrals().at(-1)!.femaleBaseTime).toBe('PT0S');
  });

  // ── onSubmit() — overlap detection ──────────────────────────────────────────
  // CORRAL_B covers [PT10800S, PT14400S) = [3:00h, 4:00h)

  it('onSubmit() should set overlap error and NOT mutate signal when times overlap existing corral', () => {
    // New range 03:30–04:30 overlaps CORRAL_B [03:00–04:00)
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'Overlap', maxCapacity: 0, minTime: '03:30', maxTime: '04:30' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(true);
    expect(component.corrals().length).toBe(countBefore);
  });

  it('onSubmit() should proceed normally when times do not overlap any existing corral', () => {
    // New range 04:00–05:00 starts exactly at CORRAL_B's end — no overlap (exclusive upper bound)
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'Clear', maxCapacity: 0, minTime: '04:00', maxTime: '05:00' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(false);
    expect(component.corrals().length).toBe(countBefore + 1);
  });

  it('onSubmit() should skip overlap check when minTime is empty', () => {
    // Partial range: no minTime — cannot determine overlap, must not block submission
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'NoMin', maxCapacity: 0, minTime: '', maxTime: '04:00' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(false);
    expect(component.corrals().length).toBe(countBefore + 1);
  });

  it('onSubmit() should skip overlap check when maxTime is empty', () => {
    // Partial range: no maxTime — cannot determine overlap, must not block submission
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.openPanel();
    component.corralForm.patchValue({ name: 'NoMax', maxCapacity: 0, minTime: '03:30', maxTime: '' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(false);
    expect(component.corrals().length).toBe(countBefore + 1);
  });

  // ── deleteCorral() ───────────────────────────────────────────────────────────

  it('deleteCorral() should remove the corral from the signal', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const idsBefore = component.corrals().map(c => c.corralId);
    component.deleteCorral(CORRAL_A.corralId);
    expect(component.corrals().map(c => c.corralId)).not.toContain(CORRAL_A.corralId);
    expect(component.corrals().length).toBe(idsBefore.length - 1);
  });

  it('deleteCorral() should close and clear the panel when deleting the corral being edited', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    component.deleteCorral(CORRAL_B.corralId);
    expect(component.isSidePanelOpen()).toBe(false);
    expect(component.editingCorralId).toBeNull();
  });

  it('deleteCorral() should NOT close the panel when a different corral is being edited', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    component.deleteCorral(CORRAL_A.corralId);
    expect(component.isSidePanelOpen()).toBe(true);
    expect(component.editingCorralId).toBe(CORRAL_B.corralId);
  });

  // ── editCorral() ─────────────────────────────────────────────────────────────

  it('editCorral() should set editingCorralId', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    expect(component.editingCorralId).toBe(CORRAL_B.corralId);
  });

  it('editCorral() should open the side panel', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    expect(component.isSidePanelOpen()).toBe(true);
  });

  it('editCorral() should patch the form with the corral name', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    expect(component.corralForm.value.name).toBe(CORRAL_B.name);
  });

  it('editCorral() should convert minTime ISO 8601 to HH:mm in form', () => {
    // CORRAL_B.minTime = 'PT10800S' = 3h = '03:00'
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    expect(component.corralForm.value.minTime).toBe('03:00');
  });

  it('editCorral() should convert maxTime ISO 8601 to HH:mm in form', () => {
    // CORRAL_B.maxTime = 'PT14400S' = 4h = '04:00'
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    expect(component.corralForm.value.maxTime).toBe('04:00');
  });

  it('editCorral() should map null minTime to empty string in form', () => {
    // CORRAL_A.minTime = null
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_A);
    expect(component.corralForm.value.minTime).toBe('');
  });

  // ── onSubmit() — edit mode ───────────────────────────────────────────────────

  it('onSubmit() in edit mode should update the corral name in the signal', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    component.corralForm.patchValue({ name: 'Corral B Renamed' });
    component.onSubmit();
    const updated = component.corrals().find(c => c.corralId === CORRAL_B.corralId);
    expect(updated?.name).toBe('Corral B Renamed');
  });

  it('onSubmit() in edit mode should NOT change the signal length', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    const countBefore = component.corrals().length;
    component.editCorral(CORRAL_B);
    component.corralForm.patchValue({ name: 'Corral B Renamed' });
    component.onSubmit();
    expect(component.corrals().length).toBe(countBefore);
  });

  it('onSubmit() in edit mode should clear editingCorralId after save', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    component.corralForm.patchValue({ name: 'Corral B Renamed' });
    component.onSubmit();
    expect(component.editingCorralId).toBeNull();
  });

  it('onSubmit() in edit mode should NOT flag overlap against the corral being edited', () => {
    // Saving CORRAL_B with its own time range should NOT trigger overlap
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    component.editCorral(CORRAL_B);
    // CORRAL_B minTime = PT10800S = 03:00, maxTime = PT14400S = 04:00
    component.corralForm.patchValue({ name: 'B', minTime: '03:00', maxTime: '04:00' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(false);
    expect(component.editingCorralId).toBeNull();
  });

  it('onSubmit() in edit mode should flag overlap when new range conflicts with another corral', () => {
    // CORRAL_A has null minTime so no overlap; add a third corral first, then overlap it
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    // CORRAL_B occupies [03:00, 04:00). Try to resize it to overlap CORRAL_A's maxTime window.
    // CORRAL_A.maxTime = 'PT10800S' = 03:00; minTime = null → skipped in overlap.
    // Add a concrete corral that occupies [01:00, 02:00) so CORRAL_B can overlap it.
    component.openPanel();
    component.corralForm.patchValue({ name: 'New', maxCapacity: 0, minTime: '01:00', maxTime: '02:00' });
    component.onSubmit();
    // Now edit CORRAL_B and push its range into [01:30, 04:00) — overlaps [01:00, 02:00)
    component.editCorral(CORRAL_B);
    component.corralForm.patchValue({ name: 'B', minTime: '01:30', maxTime: '04:00' });
    component.onSubmit();
    expect(component.corralForm.hasError('overlap')).toBe(true);
  });
});

// ── timeRangeValidator (pure unit, no TestBed) ──────────────────────────────

describe('timeRangeValidator', () => {
  const fb = new FormBuilder();
  const make = (min: string, max: string) =>
    fb.group({ minTime: [min], maxTime: [max] }, { validators: timeRangeValidator });

  it('returns null when both fields are empty',         () => expect(make('', '').errors).toBeNull());
  it('returns null when only minTime is set',           () => expect(make('01:00', '').errors).toBeNull());
  it('returns null when only maxTime is set',           () => expect(make('', '03:00').errors).toBeNull());
  it('returns null when minTime < maxTime',             () => expect(make('01:00', '03:00').errors).toBeNull());
  it('returns { timeRangeInvalid } when minTime === maxTime (zero-duration corral not allowed)',
    () => expect(make('02:00', '02:00').errors).toEqual({ timeRangeInvalid: true }));
  it('returns { timeRangeInvalid } for "01:05"/"01:05" (edge case that bypassed overlap check)',
    () => expect(make('01:05', '01:05').errors).toEqual({ timeRangeInvalid: true }));
  it('returns { timeRangeInvalid } when minTime > maxTime', () =>
    expect(make('04:00', '02:00').errors).toEqual({ timeRangeInvalid: true }));
  it('returns null when values are not parseable (graceful)', () =>
    expect(make('bad', 'worse').errors).toBeNull());
  it('works with HH:mm:ss format',                     () => expect(make('01:00:00', '02:00:00').errors).toBeNull());
  it('detects invalid range with seconds precision',   () =>
    expect(make('03:00:01', '03:00:00').errors).toEqual({ timeRangeInvalid: true }));
});
