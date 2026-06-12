import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { EventsPage } from '../models/event.model';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the first page of events with correct pagination', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(1, 5).subscribe((r) => (result = r));
    tick(800);

    expect(result).toBeDefined();
    expect(result!.data.length).toBe(5);
    expect(result!.page).toBe(1);
    expect(result!.limit).toBe(5);
    expect(result!.total).toBe(12);
  }));

  it('should return the second page with remaining events', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(2, 5).subscribe((r) => (result = r));
    tick(800);

    expect(result!.data.length).toBe(5);
    expect(result!.page).toBe(2);
  }));

  it('should return last partial page correctly', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(3, 5).subscribe((r) => (result = r));
    tick(800);

    expect(result!.data.length).toBe(2);
  }));

  it('should filter events by search term (case-insensitive)', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(1, 10, 'cdmx').subscribe((r) => (result = r));
    tick(800);

    expect(result!.data.length).toBe(2);
    result!.data.forEach((e) =>
      expect(e.name.toLowerCase()).toContain('cdmx')
    );
  }));

  it('should return empty data when no events match the search', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(1, 5, 'nonexistent-event-xyz').subscribe((r) => (result = r));
    tick(800);

    expect(result!.data.length).toBe(0);
    expect(result!.total).toBe(0);
  }));

  it('should ignore leading/trailing whitespace in search term', fakeAsync(() => {
    let result: EventsPage | undefined;
    service.getEvents(1, 10, '  monterrey  ').subscribe((r) => (result = r));
    tick(800);

    expect(result!.data.length).toBe(1);
    expect(result!.data[0].name).toContain('Monterrey');
  }));

  it('should emit with 800ms delay', fakeAsync(() => {
    let emitted = false;
    service.getEvents(1, 5).subscribe(() => (emitted = true));

    tick(799);
    expect(emitted).toBe(false);

    tick(1);
    expect(emitted).toBe(true);
  }));
});
