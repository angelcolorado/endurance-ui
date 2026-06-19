import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { EventLogisticsComponent } from './event-logistics.component';
import { LogisticsEventDetail } from '../../../../core/models/logistics.model';

const API_URL = 'http://localhost:8080/api/v1/logistics/events/evt-42';

const MOCK_DETAIL: LogisticsEventDetail = {
  eventId: 'evt-42',
  name: 'Test Marathon',
  raceDate: '2026-11-22',
  offerings: [{ distance: 'MARATHON', modality: 'INDIVIDUAL', teamSize: 1 }],
  isRelay: false,
  corralConfigurations: [
    {
      corralId: 'c-1', corralName: 'Corral A', order: 1,
      minTime: null, maxTime: 'PT10800S',
      maxCapacity: 500, registeredCount: 320,
      isParaAthleteCorral: false, isRestricted: false,
    },
    {
      corralId: 'c-2', corralName: 'Corral B — Para', order: 2,
      minTime: 'PT10800S', maxTime: 'PT14400S',
      maxCapacity: 50, registeredCount: 12,
      isParaAthleteCorral: true, isRestricted: false,
    },
  ],
  status: 'CONFIGURATION_PHASE',
  contractedPacers: [],
  openCorral: false,
};

const MOCK_EMPTY: LogisticsEventDetail = {
  ...MOCK_DETAIL,
  corralConfigurations: [],
};

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

  it('should set error state on HTTP failure', () => {
    httpMock.expectOne(API_URL).flush('error', { status: 500, statusText: 'Server Error' });
    expect(component.state().status).toBe('error');
  });

  it('should set error state on 404 (event not found)', () => {
    httpMock.expectOne(API_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(component.state().status).toBe('error');
  });

  it('should render event name in header when loaded', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('Test Marathon');
  });

  it('should render status badge when loaded', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('[aria-label^="Event status:"]'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('Configurando');
  });

  it('should render one app-corral-card per corral configuration', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('app-corral-card'));
    expect(cards.length).toBe(2);
  });

  it('should render empty state heading when corralConfigurations is empty', () => {
    httpMock.expectOne(API_URL).flush(MOCK_EMPTY);
    fixture.detectChanges();
    const h2 = fixture.debugElement.query(By.css('h2'));
    expect(h2?.nativeElement.textContent).toContain('Comienza a diseñar tu logística');
  });

  it('should render "+ Crear Primer Corral" CTA in empty state', () => {
    httpMock.expectOne(API_URL).flush(MOCK_EMPTY);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(
      By.css('button[aria-label="Create the first corral for this event"]')
    );
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.textContent).toContain('Crear Primer Corral');
  });

  it('getStatusMeta should return correct label for READY_FOR_ALLOCATION', () => {
    httpMock.expectOne(API_URL).flush(MOCK_DETAIL);
    expect(component.getStatusMeta('READY_FOR_ALLOCATION').label).toBe('Listo para Asignar');
  });
});
