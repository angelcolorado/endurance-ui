import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LogisticsService } from './logistics.service';
import { CorralsResponse, LogisticsEventDetail, Page, LogisticsEventSummary } from '../models/logistics.model';

const CORRALS_URL = 'http://localhost:8080/api/v1/logistics/events/evt-1/corrals';
const DETAIL_URL  = 'http://localhost:8080/api/v1/logistics/events/evt-1';

describe('LogisticsService', () => {
  let service: LogisticsService;
  let httpMock: HttpTestingController;

  const MOCK_DETAIL: LogisticsEventDetail = {
    eventId: 'evt-1',
    name: 'Guadalajara Marathon 2026',
    raceDate: '2026-11-22',
    offerings: [{ distance: 'MARATHON', modality: 'INDIVIDUAL', teamSize: 1 }],
    isRelay: false,
    corralConfigurations: [],
    status: 'CONFIGURATION_PHASE',
    contractedPacers: [],
    openCorral: false,
  };

  const MOCK_CORRALS: CorralsResponse = {
    eventId: 'evt-1',
    eventName: 'Guadalajara Marathon 2026',
    corralsByDistance: {
      MARATHON: [{
        corralId: 'c-1', name: 'Corral A', order: 1,
        maleBaseTime: 'PT10800S', femaleBaseTime: 'PT12600S',
        minTime: null, maxTime: 'PT10800S',
        maxCapacity: 500, registeredCount: 320,
        isParaAthleteCorral: false, isRestricted: false,
        assignedPacers: [],
      }],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(LogisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── getEventDetails ──────────────────────────────────────────────────────────

  it('getEventDetails should GET /api/v1/logistics/events/:id', () => {
    service.getEventDetails('evt-1').subscribe();
    const req = httpMock.expectOne(DETAIL_URL);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_DETAIL);
  });

  it('getEventDetails should return the full LogisticsEventDetail on 200', () => {
    let result: LogisticsEventDetail | undefined;
    service.getEventDetails('evt-1').subscribe(r => (result = r));
    httpMock.expectOne(DETAIL_URL).flush(MOCK_DETAIL);
    expect(result).toEqual(MOCK_DETAIL);
  });

  it('getEventDetails should propagate 404 errors', () => {
    let errorStatus: number | undefined;
    service.getEventDetails('evt-1').subscribe({ error: (e) => (errorStatus = e.status) });
    httpMock.expectOne(DETAIL_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(errorStatus).toBe(404);
  });

  it('getEventDetails should propagate 500 errors', () => {
    let errorStatus: number | undefined;
    service.getEventDetails('evt-1').subscribe({ error: (e) => (errorStatus = e.status) });
    httpMock.expectOne(DETAIL_URL).flush('Error', { status: 500, statusText: 'Internal Server Error' });
    expect(errorStatus).toBe(500);
  });

  // ── getCorrals ───────────────────────────────────────────────────────────────

  it('getCorrals should GET /api/v1/logistics/events/:id/corrals', () => {
    service.getCorrals('evt-1').subscribe();
    const req = httpMock.expectOne(CORRALS_URL);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_CORRALS);
  });

  it('getCorrals should return empty CorralsResponse on 404', () => {
    let result: CorralsResponse | undefined;
    service.getCorrals('evt-1').subscribe(r => (result = r));
    httpMock.expectOne(CORRALS_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(result).toEqual({ corralsByDistance: {} });
  });

  it('getCorrals should propagate non-404 errors', () => {
    let errorStatus: number | undefined;
    service.getCorrals('evt-1').subscribe({ error: (e) => (errorStatus = e.status) });
    httpMock.expectOne(CORRALS_URL).flush('Error', { status: 500, statusText: 'Internal Server Error' });
    expect(errorStatus).toBe(500);
  });

  // ── getLogisticsEvents ───────────────────────────────────────────────────────

  it('getLogisticsEvents should GET /api/v1/logistics/events with page and size params', () => {
    const URL = 'http://localhost:8080/api/v1/logistics/events?page=0&size=20';
    const mockPage: Page<LogisticsEventSummary> = {
      content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
    };
    service.getLogisticsEvents().subscribe();
    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('getLogisticsEvents should accept custom page and size', () => {
    const URL = 'http://localhost:8080/api/v1/logistics/events?page=2&size=10';
    service.getLogisticsEvents(2, 10).subscribe();
    httpMock.expectOne(URL).flush({
      content: [], totalElements: 0, totalPages: 0, number: 2, size: 10,
    });
  });
});
