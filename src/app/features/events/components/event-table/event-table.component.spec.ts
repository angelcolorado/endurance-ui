import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EventTableComponent } from './event-table.component';
import { EventsPage } from '../../../../core/models/event.model';

const MOCK_PAGE: EventsPage = {
  data: [
    { id: '1', name: 'Monterrey 2026',  date: '2026-06-28', registeredAthletes: 3200, status: 'Active'    },
    { id: '2', name: 'Trail Bajío',      date: '2026-07-12', registeredAthletes: 1850, status: 'Upcoming'  },
    { id: '3', name: 'Marathon CDMX',    date: '2026-08-03', registeredAthletes: 7400, status: 'Completed' },
    { id: '4', name: 'Cancún 70.3',      date: '2026-08-17', registeredAthletes: 2100, status: 'Cancelled' },
  ],
  total: 12,
  page: 1,
  limit: 4,
};

describe('EventTableComponent', () => {
  let fixture: ComponentFixture<EventTableComponent>;
  let component: EventTableComponent;

  function create(
    page = MOCK_PAGE,
    search = '',
    isLoading = false,
  ) {
    fixture = TestBed.createComponent(EventTableComponent);
    fixture.componentRef.setInput('eventsPage', page);
    fixture.componentRef.setInput('searchValue', search);
    fixture.componentRef.setInput('isLoading', isLoading);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTableComponent],
    }).compileComponents();
  });

  it('should create', () => {
    create();
    expect(component).toBeTruthy();
  });

  // ── Skeleton vs real rows ─────────────────────────────────────────────

  it('should render skeleton rows when isLoading is true', () => {
    create(MOCK_PAGE, '', true);
    const skeletonCells = fixture.debugElement.queryAll(By.css('tbody td div.animate-pulse'));
    expect(skeletonCells.length).toBeGreaterThan(0);
  });

  it('should NOT render real data rows when isLoading is true', () => {
    create(MOCK_PAGE, '', true);
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Monterrey 2026');
  });

  it('should render real data rows when isLoading is false', () => {
    create();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows).toHaveLength(MOCK_PAGE.data.length);
  });

  it('toolbar and table headers are always present regardless of isLoading', () => {
    create(MOCK_PAGE, '', true);
    const searchInput = fixture.debugElement.query(By.css('input[type="search"]'));
    const headers = fixture.debugElement.queryAll(By.css('thead th'));
    expect(searchInput).toBeTruthy();
    expect(headers).toHaveLength(4);
  });

  it('should display event names in the table when not loading', () => {
    create();
    const text = fixture.nativeElement.textContent as string;
    MOCK_PAGE.data.forEach((e) => expect(text).toContain(e.name));
  });

  it('should show empty-state row when data is empty and not loading', () => {
    create({ ...MOCK_PAGE, data: [], total: 0 });
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows).toHaveLength(1);
    expect(rows[0].nativeElement.textContent).toContain('No events match');
  });

  it('should show total count in toolbar', () => {
    create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('12');
  });

  // ── Debounced search ──────────────────────────────────────────────────

  it('should NOT emit searchChange before debounce window (300ms)', fakeAsync(() => {
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    Object.defineProperty(input.nativeElement, 'value', { value: 'cd' });
    input.nativeElement.dispatchEvent(new Event('input'));

    tick(299);
    expect(emitted).toHaveLength(0);
  }));

  it('should emit searchChange after 300ms debounce', fakeAsync(() => {
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    Object.defineProperty(input.nativeElement, 'value', { value: 'cdmx' });
    input.nativeElement.dispatchEvent(new Event('input'));

    tick(300);
    expect(emitted).toEqual(['cdmx']);
  }));

  it('should emit only the last value when typing fast (debounce collapses)', fakeAsync(() => {
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    for (const val of ['m', 'mo', 'mon', 'mont']) {
      Object.defineProperty(input.nativeElement, 'value', { value: val });
      input.nativeElement.dispatchEvent(new Event('input'));
      tick(50);
    }
    tick(300);
    // only the last value emitted after the debounce settles
    expect(emitted).toEqual(['mont']);
  }));

  it('should NOT emit duplicate values (distinctUntilChanged)', fakeAsync(() => {
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    for (const val of ['cdmx', 'cdmx']) {
      Object.defineProperty(input.nativeElement, 'value', { value: val });
      input.nativeElement.dispatchEvent(new Event('input'));
      tick(300);
    }
    expect(emitted).toHaveLength(1);
  }));

  // ── Status badges ─────────────────────────────────────────────────────

  it('getStatusClasses should return emerald for Active', () => {
    create();
    expect(component.getStatusClasses('Active')).toContain('text-emerald-400');
  });

  it('getStatusClasses should return blue for Upcoming', () => {
    create();
    expect(component.getStatusClasses('Upcoming')).toContain('text-blue-400');
  });

  it('getStatusClasses should return slate for Completed', () => {
    create();
    expect(component.getStatusClasses('Completed')).toContain('text-slate-400');
  });

  it('getStatusClasses should return red for Cancelled', () => {
    create();
    expect(component.getStatusClasses('Cancelled')).toContain('text-red-400');
  });

  // ── Pagination output ─────────────────────────────────────────────────

  it('should emit pageChange when a page button is clicked', () => {
    create({ ...MOCK_PAGE, total: 20 });
    fixture.detectChanges();
    const emitted: number[] = [];
    component.pageChange.subscribe((e) => emitted.push(e.page));

    const pageButtons = fixture.debugElement.queryAll(By.css('[aria-label^="Page"]'));
    (pageButtons[1].nativeElement as HTMLButtonElement).click();
    expect(emitted).toContain(2);
  });

  it('should not emit pageChange for out-of-bounds page', () => {
    create();
    const emitted: number[] = [];
    component.pageChange.subscribe((e) => emitted.push(e.page));

    component.onPageChange(0);
    component.onPageChange(99);
    expect(emitted).toHaveLength(0);
  });

  // ── Pagination display ────────────────────────────────────────────────

  it('totalPages should calculate correctly', () => {
    create({ ...MOCK_PAGE, total: 12, limit: 5 });
    expect(component.totalPages()).toBe(3);
  });

  it('should hide pagination when isLoading is true', () => {
    create({ ...MOCK_PAGE, total: 20 }, '', true);
    const nav = fixture.debugElement.query(By.css('[role="navigation"]'));
    expect(nav).toBeNull();
  });

  it('should hide pagination when there is only one page', () => {
    create({ ...MOCK_PAGE, total: 4, limit: 10 });
    const nav = fixture.debugElement.query(By.css('[role="navigation"]'));
    expect(nav).toBeNull();
  });

  it('previous button should be disabled on page 1', () => {
    create({ ...MOCK_PAGE, total: 20 });
    fixture.detectChanges();
    const prevBtn = fixture.debugElement.query(By.css('[aria-label="Previous page"]'));
    expect((prevBtn.nativeElement as HTMLButtonElement).disabled).toBe(true);
  });

  it('next button should be disabled on last page', () => {
    create({ ...MOCK_PAGE, page: 3, total: 12, limit: 4 });
    fixture.detectChanges();
    const nextBtn = fixture.debugElement.query(By.css('[aria-label="Next page"]'));
    expect((nextBtn.nativeElement as HTMLButtonElement).disabled).toBe(true);
  });
});
