import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import {
  LogisticsEventListComponent,
  STATUS_META,
} from './logistics-event-list.component';
import { Page, LogisticsEventSummary } from '../../../../core/models/logistics.model';

const API_URL = 'http://localhost:8080/api/v1/logistics/events?page=0&size=20';

const MOCK_EVENT: LogisticsEventSummary = {
  eventId: 'evt-1',
  name: 'Guadalajara Marathon 2026',
  raceDate: '2026-11-22',
  status: 'READY_FOR_ALLOCATION',
  openCorral: false,
};

const MOCK_PAGE: Page<LogisticsEventSummary> = {
  content: [MOCK_EVENT],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
};

// ── STATUS_META constant ─────────────────────────────────────────────────────

describe('STATUS_META', () => {
  it('should define metadata for all 6 statuses', () => {
    const keys = Object.keys(STATUS_META);
    expect(keys).toContain('CONFIGURATION_PHASE');
    expect(keys).toContain('READY_FOR_ALLOCATION');
    expect(keys).toContain('ALLOCATION_IN_PROGRESS');
    expect(keys).toContain('ALLOCATION_COMPLETED');
    expect(keys).toContain('EXECUTION_PHASE');
    expect(keys).toContain('ARCHIVED');
  });

  it('ALLOCATION_IN_PROGRESS should have pulse: true', () => {
    expect(STATUS_META['ALLOCATION_IN_PROGRESS'].pulse).toBe(true);
  });

  it('all other statuses should have pulse: false', () => {
    const nonPulse = Object.entries(STATUS_META)
      .filter(([k]) => k !== 'ALLOCATION_IN_PROGRESS')
      .every(([, v]) => !v.pulse);
    expect(nonPulse).toBe(true);
  });
});

// ── LogisticsEventListComponent ──────────────────────────────────────────────

describe('LogisticsEventListComponent', () => {
  let fixture: ComponentFixture<LogisticsEventListComponent>;
  let component: LogisticsEventListComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticsEventListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticsEventListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => expect(component).toBeTruthy());

  it('should be in loading state initially', () => {
    expect(component.state().status).toBe('loading');
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
  });

  it('should transition to loaded state after HTTP response', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
    expect(component.state().status).toBe('loaded');
  });

  it('should set error state on HTTP failure', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL })
      .flush('err', { status: 500, statusText: 'Server Error' });
    expect(component.state().status).toBe('error');
  });

  it('getStatusMeta should return correct label for READY_FOR_ALLOCATION', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
    expect(component.getStatusMeta('READY_FOR_ALLOCATION').label).toBe('Listo para Asignar');
  });

  it('should render one row per event', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('[role="listitem"]'));
    expect(rows.length).toBe(1);
  });

  it('should show Open Corral badge when openCorral is true', () => {
    const pageWithOpen: Page<LogisticsEventSummary> = {
      ...MOCK_PAGE,
      content: [{ ...MOCK_EVENT, openCorral: true }],
    };
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(pageWithOpen);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('[aria-label="Has open or custom corral"]'));
    expect(badge).toBeTruthy();
  });

  it('should NOT show Open Corral badge when openCorral is false', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('[aria-label="Has open or custom corral"]'));
    expect(badge).toBeNull();
  });

  it('should render empty state when content is empty', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush({ ...MOCK_PAGE, content: [], totalElements: 0 });
    fixture.detectChanges();
    const heading = fixture.debugElement.queryAll(By.css('h2'))
      .find(el => el.nativeElement.textContent.includes('No logistics events found'));
    expect(heading).toBeTruthy();
  });

  it('each row should link to /logistics/:eventId', () => {
    httpMock.expectOne({ method: 'GET', url: API_URL }).flush(MOCK_PAGE);
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('[role="listitem"]'));
    expect(link.attributes['ng-reflect-router-link']).toContain('evt-1');
  });
});
