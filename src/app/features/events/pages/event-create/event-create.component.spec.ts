import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AbstractControl } from '@angular/forms';
import {
  EventCreateComponent,
  futureDateValidator,
  DISTANCE_CATEGORIES,
  OFFERING_MODALITIES,
} from './event-create.component';

const API_URL = 'http://localhost:8080/api/v1/catalog/events';

// ── futureDateValidator unit tests ──────────────────────────────────────────

describe('futureDateValidator', () => {
  function ctrl(value: string): AbstractControl {
    return { value } as AbstractControl;
  }

  it('should return null for an empty value', () => {
    expect(futureDateValidator(ctrl(''))).toBeNull();
  });

  it('should return null for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(futureDateValidator(ctrl(today))).toBeNull();
  });

  it('should return null for a future date', () => {
    expect(futureDateValidator(ctrl('2099-12-31'))).toBeNull();
  });

  it('should return { pastDate: true } for a past date', () => {
    expect(futureDateValidator(ctrl('2020-01-01'))).toEqual({ pastDate: true });
  });
});

// ── Enum constants ────────────────────────────────────────────────────────────

describe('DISTANCE_CATEGORIES', () => {
  it('should contain all five distance values', () => {
    expect(DISTANCE_CATEGORIES).toEqual(['FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'ULTRA']);
  });
});

describe('OFFERING_MODALITIES', () => {
  it('should contain INDIVIDUAL and RELAY', () => {
    expect(OFFERING_MODALITIES).toEqual(['INDIVIDUAL', 'RELAY']);
  });
});

// ── EventCreateComponent ─────────────────────────────────────────────────────

describe('EventCreateComponent', () => {
  let fixture: ComponentFixture<EventCreateComponent>;
  let component: EventCreateComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  const VALID_VALUES = {
    name: 'Monterrey 2027',
    description: 'Annual race event',
    raceDate: '2099-12-31',
    city: 'Monterrey',
    issuingAuthority: 'FMA',
    convocatoriaPublicationDate: '2026-06-01',
    offerings: [{ distance: 'MARATHON', modality: 'INDIVIDUAL', teamSize: 1 }],
    tiers: [{ name: 'Early Bird', startDate: '2026-01-01', endDate: '2026-03-31', price: 800 }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── FormArray initialisation ─────────────────────────────────────────────

  it('should initialise offerings FormArray with one MARATHON/INDIVIDUAL row', () => {
    expect(component.offerings.length).toBe(1);
    const first = component.offerings.at(0).value;
    expect(first.distance).toBe('MARATHON');
    expect(first.modality).toBe('INDIVIDUAL');
    expect(first.teamSize).toBe(1);
  });

  it('should initialise tiers FormArray with one Early Bird entry', () => {
    expect(component.tiers.length).toBe(1);
    expect(component.firstTier.value.name).toBe('Early Bird');
    expect(component.firstTier.value.price).toBe(800);
  });

  // ── addOffering / removeOffering ─────────────────────────────────────────

  it('addOffering should append a new row with default values', () => {
    component.addOffering();
    expect(component.offerings.length).toBe(2);
    expect(component.offerings.at(1).value.distance).toBe('MARATHON');
  });

  it('removeOffering should delete the row at the given index', () => {
    component.addOffering();
    component.removeOffering(0);
    expect(component.offerings.length).toBe(1);
  });

  it('removeOffering should not remove the last remaining row', () => {
    component.removeOffering(0);
    expect(component.offerings.length).toBe(1);
  });

  // ── name validators ──────────────────────────────────────────────────────

  it('name: invalid when empty', () => {
    component.form.get('name')!.setValue('');
    expect(component.form.get('name')!.hasError('required')).toBe(true);
  });

  it('name: invalid when fewer than 5 chars', () => {
    component.form.get('name')!.setValue('ABC');
    expect(component.form.get('name')!.hasError('minlength')).toBe(true);
  });

  it('name: valid with 5+ chars', () => {
    component.form.get('name')!.setValue('Monterrey 2027');
    expect(component.form.get('name')!.valid).toBe(true);
  });

  // ── raceDate validators ──────────────────────────────────────────────────

  it('raceDate: invalid when empty', () => {
    component.form.get('raceDate')!.setValue('');
    expect(component.form.get('raceDate')!.hasError('required')).toBe(true);
  });

  it('raceDate: invalid for a past date', () => {
    component.form.get('raceDate')!.setValue('2020-01-01');
    expect(component.form.get('raceDate')!.hasError('pastDate')).toBe(true);
  });

  it('raceDate: valid for a future date', () => {
    component.form.get('raceDate')!.setValue('2099-12-31');
    expect(component.form.get('raceDate')!.valid).toBe(true);
  });

  // ── onFileSelected ───────────────────────────────────────────────────────

  it('should set selectedFile and clear fileError on valid selection', () => {
    const file = new File(['%PDF-1.4'], 'convocatoria.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
    expect(component.fileError()).toBeNull();
  });

  it('should set fileError when no file is selected', () => {
    const event = { target: { files: [] } } as unknown as Event;
    component.onFileSelected(event);
    expect(component.selectedFile).toBeNull();
    expect(component.fileError()).toBeTruthy();
  });

  // ── onSubmit guards ──────────────────────────────────────────────────────

  it('should not call the service when form is invalid', () => {
    component.onSubmit();
    httpMock.expectNone(API_URL);
  });

  it('should not call the service when form is valid but no file attached', () => {
    component.form.setValue(VALID_VALUES);
    component.selectedFile = null;
    component.onSubmit();
    httpMock.expectNone(API_URL);
    expect(component.fileError()).toBeTruthy();
  });

  // ── onSubmit happy path ──────────────────────────────────────────────────

  it('should POST multipart/form-data and navigate to /events on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const file = new File(['%PDF-1.4'], 'convocatoria.pdf', { type: 'application/pdf' });

    component.form.setValue(VALID_VALUES);
    component.selectedFile = file;
    component.onSubmit();

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    // Content-Type must NOT be manually set — browser sets it with the multipart boundary
    expect(req.request.headers.has('Content-Type')).toBe(false);
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({});

    expect(navigateSpy).toHaveBeenCalledWith(['/events']);
  });

  it('should set submitError signal on HTTP failure', () => {
    const file = new File(['%PDF-1.4'], 'convocatoria.pdf', { type: 'application/pdf' });
    component.form.setValue(VALID_VALUES);
    component.selectedFile = file;
    component.onSubmit();

    httpMock.expectOne(API_URL).flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(component.submitError()).toBeTruthy();
  });

  it('should set isLoading to true during request and false after', () => {
    const file = new File(['%PDF-1.4'], 'convocatoria.pdf', { type: 'application/pdf' });
    component.form.setValue(VALID_VALUES);
    component.selectedFile = file;
    component.onSubmit();

    expect(component.isLoading()).toBe(true);
    httpMock.expectOne(API_URL).flush({});
    expect(component.isLoading()).toBe(false);
  });

  // ── DOM: submit button disabled ──────────────────────────────────────────

  it('submit button should be disabled when form is invalid', () => {
    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect((btn.nativeElement as HTMLButtonElement).disabled).toBe(true);
  });

  it('submit button should be disabled when form is valid but no file attached', () => {
    component.form.setValue(VALID_VALUES);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect((btn.nativeElement as HTMLButtonElement).disabled).toBe(true);
  });

  it('submit button should be enabled when form is valid and file is attached', () => {
    component.form.setValue(VALID_VALUES);
    component.selectedFile = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' });
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect((btn.nativeElement as HTMLButtonElement).disabled).toBe(false);
  });
});
