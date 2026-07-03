import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../../core/services/event.service';
import { EventsPage } from '../../../../core/models/event.model';

const MOCK_PAGE: EventsPage = {
  data: [
    { id: '1', name: 'Monterrey 2026', raceDate: '2026-06-28', city: 'Monterrey', registeredAthletes: 3200, status: 'PUBLISHED' },
  ],
  total: 1,
  page: 1,
  limit: 5,
};

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;
  let mockEventService: { getEvents: ReturnType<typeof vi.fn>; publishEvent: ReturnType<typeof vi.fn> };
  // A controllable subject lets us decide when the observable emits.
  let responseSubject: Subject<EventsPage>;

  beforeEach(async () => {
    responseSubject = new Subject<EventsPage>();
    mockEventService = {
      getEvents: vi.fn().mockReturnValue(responseSubject.asObservable()),
      publishEvent: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: mockEventService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call EventService.getEvents on init', () => {
    expect(mockEventService.getEvents).toHaveBeenCalledWith(1, 5, '');
  });

  it('should set isLoading to true on init before data arrives', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBe(true);
  });

  it('should hide skeleton and show table after data loads', () => {
    responseSubject.next(MOCK_PAGE);
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css('[aria-label="Loading events"]'));
    const table = fixture.debugElement.query(By.css('app-event-table'));

    expect(skeleton).toBeNull();
    expect(table).toBeTruthy();
  });

  it('should set isLoading to false after data arrives', () => {
    expect(component.isLoading()).toBe(true);
    responseSubject.next(MOCK_PAGE);
    expect(component.isLoading()).toBe(false);
  });

  it('should reset to page 1 and re-fetch on search change', () => {
    responseSubject.next(MOCK_PAGE);
    component.currentPage.set(3);
    component.onSearchChange('cdmx');

    expect(component.currentPage()).toBe(1);
    expect(component.searchTerm()).toBe('cdmx');
    expect(mockEventService.getEvents).toHaveBeenCalledWith(1, 5, 'cdmx');
  });

  it('should fetch the correct page on page change', () => {
    responseSubject.next(MOCK_PAGE);
    component.onPageChange({ page: 2 });

    expect(component.currentPage()).toBe(2);
    expect(mockEventService.getEvents).toHaveBeenCalledWith(2, 5, '');
  });
});
