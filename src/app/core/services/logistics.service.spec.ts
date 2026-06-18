import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LogisticsService, parseIsoDuration } from './logistics.service';
import { CorralsResponse, Page, LogisticsEventSummary } from '../models/logistics.model';

const API_URL = 'http://localhost:8080/api/v1/events/evt-1/corrals';

// ── parseIsoDuration ─────────────────────────────────────────────────────────

describe('parseIsoDuration', () => {
  it('returns "--" for null',          () => expect(parseIsoDuration(null)).toBe('--'));
  it('returns "--" for undefined',     () => expect(parseIsoDuration(undefined)).toBe('--'));
  it('returns "--" for empty string',  () => expect(parseIsoDuration('')).toBe('--'));
  it('returns "--" for "PT0S"',        () => expect(parseIsoDuration('PT0S')).toBe('--'));
  it('converts PT3600S  → "1:00h"',   () => expect(parseIsoDuration('PT3600S')).toBe('1:00h'));
  it('converts PT10800S → "3:00h"',   () => expect(parseIsoDuration('PT10800S')).toBe('3:00h'));
  it('converts PT5400S  → "1:30h"',   () => expect(parseIsoDuration('PT5400S')).toBe('1:30h'));
  it('converts PT1H30M  → "1:30h"',   () => expect(parseIsoDuration('PT1H30M')).toBe('1:30h'));
  it('converts PT2H     → "2:00h"',   () => expect(parseIsoDuration('PT2H')).toBe('2:00h'));
  it('converts PT45M    → "0:45h"',   () => expect(parseIsoDuration('PT45M')).toBe('0:45h'));
});

// ── LogisticsService ─────────────────────────────────────────────────────────

describe('LogisticsService', () => {
  let service: LogisticsService;
  let httpMock: HttpTestingController;

  const MOCK_RESPONSE: CorralsResponse = {
    eventId: 'evt-1',
    eventName: 'Guadalajara Marathon 2026',
    corralsByDistance: {
      MARATHON: [
        {
          corralId: 'c-1',
          corralName: 'Corral A',
          order: 1,
          minTime: null,
          maxTime: 'PT10800S',
          maxCapacity: 500,
          registeredCount: 320,
          isParaAthleteCorral: false,
          isRestricted: false,
        },
      ],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LogisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getCorrals should GET the correct URL', () => {
    service.getCorrals('evt-1').subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_RESPONSE);
  });

  it('getCorrals should return the full CorralsResponse', () => {
    let result: CorralsResponse | undefined;
    service.getCorrals('evt-1').subscribe(r => (result = r));
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    expect(result).toEqual(MOCK_RESPONSE);
  });

  // ── getLogisticsEvents ─────────────────────────────────────────────────────

  it('getLogisticsEvents should GET /api/v1/logistics/events with page and size params', () => {
    const LOGISTICS_URL = 'http://localhost:8080/api/v1/logistics/events?page=0&size=20';
    const mockPage: Page<LogisticsEventSummary> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
    };
    service.getLogisticsEvents().subscribe();
    const req = httpMock.expectOne(LOGISTICS_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('getLogisticsEvents should accept custom page and size', () => {
    const CUSTOM_URL = 'http://localhost:8080/api/v1/logistics/events?page=2&size=10';
    service.getLogisticsEvents(2, 10).subscribe();
    const req = httpMock.expectOne(CUSTOM_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 10 });
  });
});
