import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { EventsPage, RaceEvent } from '../models/event.model';

const API_BASE = 'http://localhost:8080';
const EVENTS_URL = `${API_BASE}/api/v1/catalog/events`;

const MOCK_EVENTS: RaceEvent[] = Array.from({ length: 5 }, (_, i) => ({
  id: `evt-${i + 1}`,
  name: i < 2 ? `CDMX Marathon ${i + 1}` : `Monterrey ${i + 1}`,
  raceDate: '2026-06-28',
  city: i < 2 ? 'CDMX' : 'Monterrey',
  registeredAthletes: 1000 + i * 100,
  status: 'PUBLISHED' as const,
}));

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getEvents should request page 0 (0-indexed) with the given size', () => {
    service.getEvents(1, 5).subscribe();
    const req = httpMock.expectOne(r =>
      r.url === EVENTS_URL && r.params.get('page') === '0' && r.params.get('size') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: MOCK_EVENTS, totalElements: 12, number: 0, size: 5 });
  });

  it('getEvents should map Spring Page response to EventsPage', () => {
    let result: EventsPage | undefined;
    service.getEvents(1, 5).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === EVENTS_URL);
    req.flush({ content: MOCK_EVENTS, totalElements: 12, number: 0, size: 5 });

    expect(result).toBeDefined();
    expect(result!.data).toEqual(MOCK_EVENTS);
    expect(result!.total).toBe(12);
    expect(result!.page).toBe(1);
    expect(result!.limit).toBe(5);
  });

  it('getEvents should handle a flat-array response with client-side pagination', () => {
    let result: EventsPage | undefined;
    service.getEvents(1, 3).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === EVENTS_URL);
    req.flush(MOCK_EVENTS); // flat array — 5 items

    expect(result!.data.length).toBe(3);     // sliced to page size
    expect(result!.total).toBe(5);
    expect(result!.page).toBe(1);
    expect(result!.limit).toBe(3);
  });

  it('getEvents should include search param when provided', () => {
    service.getEvents(1, 5, 'cdmx').subscribe();
    const req = httpMock.expectOne(r =>
      r.url === EVENTS_URL && r.params.get('search') === 'cdmx',
    );
    req.flush({ content: [], totalElements: 0, number: 0, size: 5 });
  });

  it('getEvents should omit search param when search is empty', () => {
    service.getEvents(1, 5, '').subscribe();
    const req = httpMock.expectOne(r => r.url === EVENTS_URL);
    expect(req.request.params.has('search')).toBe(false);
    req.flush({ content: [], totalElements: 0, number: 0, size: 5 });
  });

  it('getEvents should trim leading/trailing whitespace from search', () => {
    service.getEvents(1, 5, '  monterrey  ').subscribe();
    const req = httpMock.expectOne(r => r.url === EVENTS_URL);
    expect(req.request.params.get('search')).toBe('monterrey');
    req.flush({ content: [], totalElements: 0, number: 0, size: 5 });
  });

  it('publishEvent should send PATCH to the status endpoint', () => {
    service.publishEvent('evt-1').subscribe();
    const req = httpMock.expectOne(`${EVENTS_URL}/evt-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'PUBLISHED' });
    req.flush({});
  });
});
