import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EventTableComponent } from './event-table.component';
import { EventsPage } from '../../../../core/models/event.model';

const MOCK_PAGE: EventsPage = {
  data: [
    { id: '1', name: 'Monterrey 2026',  raceDate: '2026-06-28', city: 'Monterrey', registeredAthletes: 3200, status: 'PUBLISHED' },
    { id: '2', name: 'Trail Bajío',      raceDate: '2026-07-12', city: 'León',      registeredAthletes: 1850, status: 'DRAFT'     },
    { id: '3', name: 'Marathon CDMX',    raceDate: '2026-08-03', city: 'CDMX',      registeredAthletes: 7400, status: 'PUBLISHED' },
    { id: '4', name: 'Cancún 70.3',      raceDate: '2026-08-17', city: 'Cancún',    registeredAthletes: 2100, status: 'DRAFT'     },
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
      providers: [provideRouter([])],
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
    expect(headers.length).toBeGreaterThanOrEqual(4);
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

  it('should NOT emit searchChange before debounce window (300ms)', () => {
    vi.useFakeTimers();
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    Object.defineProperty(input.nativeElement, 'value', { value: 'cd' });
    input.nativeElement.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(299);
    expect(emitted).toHaveLength(0);
    vi.useRealTimers();
  });

  it('should emit searchChange after 300ms debounce', () => {
    vi.useFakeTimers();
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    Object.defineProperty(input.nativeElement, 'value', { value: 'cdmx' });
    input.nativeElement.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(300);
    expect(emitted).toEqual(['cdmx']);
    vi.useRealTimers();
  });

  it('should emit only the last value when typing fast (debounce collapses)', () => {
    vi.useFakeTimers();
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    for (const val of ['m', 'mo', 'mon', 'mont']) {
      Object.defineProperty(input.nativeElement, 'value', { value: val, writable: true, configurable: true });
      input.nativeElement.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(50);
    }
    vi.advanceTimersByTime(300);
    expect(emitted).toEqual(['mont']);
    vi.useRealTimers();
  });

  it('should NOT emit duplicate values (distinctUntilChanged)', () => {
    vi.useFakeTimers();
    create();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[type="search"]'));
    for (const val of ['cdmx', 'cdmx']) {
      Object.defineProperty(input.nativeElement, 'value', { value: val });
      input.nativeElement.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
    }
    expect(emitted).toHaveLength(1);
    vi.useRealTimers();
  });

  // ── Status badges ─────────────────────────────────────────────────────

  it('getStatusClasses should return emerald for PUBLISHED', () => {
    create();
    expect(component.getStatusClasses('PUBLISHED')).toContain('text-emerald-400');
  });

  it('getStatusClasses should return amber for DRAFT', () => {
    create();
    expect(component.getStatusClasses('DRAFT')).toContain('text-amber-400');
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
