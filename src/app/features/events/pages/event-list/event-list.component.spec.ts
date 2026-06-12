import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../../core/services/event.service';
import { EventsPage } from '../../../../core/models/event.model';

const MOCK_PAGE: EventsPage = {
  data: [
    { id: '1', name: 'Monterrey 2026', date: '2026-06-28', registeredAthletes: 3200, status: 'Active' },
  ],
  total: 1,
  page: 1,
  limit: 5,
};

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;
  let mockEventService: { getEvents: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockEventService = {
      getEvents: vi.fn().mockReturnValue(of(MOCK_PAGE).pipe(delay(800))),
    };

    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [{ provide: EventService, useValue: mockEventService }],
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

  it('should show skeleton loader while loading', () => {
    // isLoading is true right after construction before the 800ms resolves
    fixture.detectChanges();
    const skeleton = fixture.debugElement.query(By.css('[aria-label="Loading events"]'));
    expect(skeleton).toBeTruthy();
  });

  it('should hide skeleton and show table after data loads', fakeAsync(() => {
    tick(800);
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css('[aria-label="Loading events"]'));
    const table = fixture.debugElement.query(By.css('app-event-table'));

    expect(skeleton).toBeNull();
    expect(table).toBeTruthy();
  }));

  it('should set isLoading to false after data arrives', fakeAsync(() => {
    expect(component.isLoading()).toBe(true);
    tick(800);
    expect(component.isLoading()).toBe(false);
  }));

  it('should reset to page 1 and re-fetch on search change', fakeAsync(() => {
    tick(800);
    component.currentPage.set(3);
    component.onSearchChange('cdmx');

    expect(component.currentPage()).toBe(1);
    expect(component.searchTerm()).toBe('cdmx');
    expect(mockEventService.getEvents).toHaveBeenCalledWith(1, 5, 'cdmx');
  }));

  it('should fetch the correct page on page change', fakeAsync(() => {
    tick(800);
    component.onPageChange({ page: 2 });

    expect(component.currentPage()).toBe(2);
    expect(mockEventService.getEvents).toHaveBeenCalledWith(2, 5, '');
  }));
});
