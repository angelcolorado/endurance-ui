import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { EventService } from '../../../../core/services/event.service';
import { EventsPage, RaceEvent } from '../../../../core/models/event.model';
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
  readonly searchTerm  = signal('');
  readonly isLoading   = signal(false);

  // Writable signal — needed for optimistic publish updates.
  readonly eventsPage = signal<EventsPage>(EMPTY_PAGE);

  private readonly params$$ = new Subject<{ page: number; search: string }>();

  constructor() {
    this.params$$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(({ page, search }) => this.eventService.getEvents(page, PAGE_LIMIT, search)),
      tap(() => this.isLoading.set(false)),
      takeUntilDestroyed(),
    ).subscribe(page => this.eventsPage.set(page));

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

  onPublishEvent(eventId: string): void {
    this.eventService.publishEvent(eventId).subscribe({
      next: () => {
        // Optimistic update — mutate the signal in place, no refetch.
        this.eventsPage.update(current => ({
          ...current,
          data: current.data.map((e: RaceEvent) =>
            e.id === eventId ? { ...e, status: 'PUBLISHED' as const } : e
          ),
        }));
      },
    });
  }

  private dispatch(): void {
    this.params$$.next({ page: this.currentPage(), search: this.searchTerm() });
  }
}
