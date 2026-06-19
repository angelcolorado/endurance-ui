import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { EventLogisticsComponent } from './event-logistics.component';
import { CorralDetail, LogisticsEventDetail } from '../../../../core/models/logistics.model';

const API_URL = 'http://localhost:8080/api/v1/logistics/events/evt-42';

const CORRAL_A: CorralDetail = {
  corralId: 'c-1', corralName: 'Corral A', order: 1,
  minTime: null, maxTime: 'PT10800S',
  maxCapacity: 500, registeredCount: 320,
  isParaAthleteCorral: false, isRestricted: false,
};
const CORRAL_B: CorralDetail = {
  corralId: 'c-2', corralName: 'Corral B', order: 2,
  minTime: 'PT10800S', maxTime: 'PT14400S',
  maxCapacity: 50, registeredCount: 12,
  isParaAthleteCorral: true, isRestricted: false,
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

  it('should create', () => expect(component).toBeTruthy());

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
});
