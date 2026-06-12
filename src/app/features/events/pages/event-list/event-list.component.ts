import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap, startWith } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { EventService } from '../../../../core/services/event.service';
import { EventsPage } from '../../../../core/models/event.model';
import { EventTableComponent, PageChangeEvent } from '../../components/event-table/event-table.component';

const PAGE_LIMIT = 5;

const EMPTY_PAGE: EventsPage = { data: [], total: 0, page: 1, limit: PAGE_LIMIT };

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [EventTableComponent],
  templateUrl: './event-list.component.html',
})
export class EventListComponent {
  private readonly eventService = inject(EventService);

  readonly currentPage = signal(1);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);

  private readonly params$ = computed(() => ({
    page: this.currentPage(),
    search: this.searchTerm(),
  }));

  // Re-runs automatically whenever page or search changes.
  // toSignal() avoids manual subscribe/unsubscribe.
  private readonly params$$ = new Subject<{ page: number; search: string }>();

  readonly eventsPage = toSignal(
    this.params$$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(({ page, search }) =>
        this.eventService.getEvents(page, PAGE_LIMIT, search)
      ),
      tap(() => this.isLoading.set(false)),
    ),
    { initialValue: EMPTY_PAGE }
  );

  constructor() {
    // Prime the first load and keep params$$ in sync with signals.
    // effect() would be idiomatic but requires injection context guards;
    // a computed + manual dispatch keeps this fully testable.
    this.dispatch();
  }

  onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.dispatch();
  }

  onSearchChange(term: string): void {
    this.currentPage.set(1);
    this.searchTerm.set(term);
    this.dispatch();
  }

  private dispatch(): void {
    this.params$$.next({ page: this.currentPage(), search: this.searchTerm() });
  }
}
