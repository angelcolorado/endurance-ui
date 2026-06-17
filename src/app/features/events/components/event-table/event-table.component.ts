import { Component, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RaceEvent, EventStatus, EventsPage } from '../../../../core/models/event.model';

export interface PageChangeEvent {
  page: number;
}

@Component({
  selector: 'app-event-table',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './event-table.component.html',
})
export class EventTableComponent {
  readonly eventsPage  = input.required<EventsPage>();
  readonly searchValue = input<string>('');
  readonly isLoading   = input<boolean>(false);

  readonly pageChange   = output<PageChangeEvent>();
  readonly searchChange = output<string>();
  readonly publishEvent = output<string>();

  readonly searchTerm$ = new Subject<string>();

  constructor() {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((term) => this.searchChange.emit(term));
  }

  onSearch(event: Event): void {
    this.searchTerm$.next((event.target as HTMLInputElement).value);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit({ page });
  }

  onPublish(eventId: string): void {
    this.publishEvent.emit(eventId);
  }

  totalPages(): number {
    const { total, limit } = this.eventsPage();
    return Math.max(1, Math.ceil(total / limit));
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getStatusClasses(status: EventStatus): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1';
    switch (status) {
      case 'DRAFT':     return `${base} bg-amber-500/15 text-amber-400 ring-amber-500/30`;
      case 'PUBLISHED': return `${base} bg-emerald-500/15 text-emerald-400 ring-emerald-500/30`;
    }
  }

  getPaginationBtnClasses(page: number): string {
    const current = this.eventsPage().page;
    const base = 'w-9 h-9 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
    return page === current
      ? `${base} bg-blue-600 text-white`
      : `${base} text-slate-400 hover:bg-slate-700 hover:text-white`;
  }
}
