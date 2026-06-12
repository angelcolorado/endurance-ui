import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DashboardComponent, LogisticsStatus } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Metrics ─────────────────────────────────────────────────────────────

  it('should render exactly 4 metric cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.metric-card'));
    expect(cards).toHaveLength(4);
  });

  it('should display all metric titles in the DOM', () => {
    const text = fixture.nativeElement.textContent as string;
    for (const metric of component.metrics()) {
      expect(text).toContain(metric.title);
    }
  });

  it('should display all metric values in the DOM', () => {
    const text = fixture.nativeElement.textContent as string;
    for (const metric of component.metrics()) {
      expect(text).toContain(metric.value);
    }
  });

  it('should apply emerald trend color to upward metrics', () => {
    const trendEls = fixture.debugElement.queryAll(By.css('.metric-card p.text-emerald-400'));
    const upwardCount = component.metrics().filter((m) => m.trendUp).length;
    expect(trendEls.length).toBe(upwardCount);
  });

  it('should apply red trend color to downward metrics', () => {
    const trendEls = fixture.debugElement.queryAll(By.css('.metric-card p.text-red-400'));
    const downwardCount = component.metrics().filter((m) => !m.trendUp).length;
    expect(trendEls.length).toBe(downwardCount);
  });

  it('should react to metric signal updates', () => {
    component.metrics.set([
      {
        title: 'Test Metric',
        value: '999',
        trend: 'Flat',
        trendUp: true,
        iconPath: 'M0 0',
        accentBg: 'bg-blue-600/20',
        accentText: 'text-blue-400',
      },
    ]);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.metric-card'));
    expect(cards).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Test Metric');
  });

  // ── Upcoming Events ──────────────────────────────────────────────────────

  it('should render exactly 3 event rows', () => {
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows).toHaveLength(3);
  });

  it('should display all event names in the table', () => {
    const text = fixture.nativeElement.textContent as string;
    for (const event of component.upcomingEvents()) {
      expect(text).toContain(event.name);
    }
  });

  it('should display all event dates in the table', () => {
    const text = fixture.nativeElement.textContent as string;
    for (const event of component.upcomingEvents()) {
      expect(text).toContain(event.date);
    }
  });

  it('should react to upcomingEvents signal updates', () => {
    component.upcomingEvents.set([]);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows).toHaveLength(0);
  });

  // ── Status badges ────────────────────────────────────────────────────────

  it('should apply emerald classes to Approved badge', () => {
    const classes = component.getBadgeClasses('Approved');
    expect(classes).toContain('bg-emerald-500/15');
    expect(classes).toContain('text-emerald-400');
  });

  it('should apply amber classes to Under Review badge', () => {
    const classes = component.getBadgeClasses('Under Review');
    expect(classes).toContain('bg-amber-500/15');
    expect(classes).toContain('text-amber-400');
  });

  it('should apply slate classes to Pending badge', () => {
    const classes = component.getBadgeClasses('Pending');
    expect(classes).toContain('bg-slate-500/15');
    expect(classes).toContain('text-slate-400');
  });

  it('should render correct badge for each event status', () => {
    const badges = fixture.debugElement.queryAll(By.css('tbody tr td:last-child span'));
    const statuses: LogisticsStatus[] = ['Approved', 'Under Review', 'Pending'];

    badges.forEach((badge, i) => {
      const el = badge.nativeElement as HTMLElement;
      expect(el.textContent?.trim()).toBe(statuses[i]);
    });
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  it('should have aria-label on each metric card', () => {
    const cards = fixture.debugElement.queryAll(By.css('.metric-card'));
    cards.forEach((card) => {
      const label = card.nativeElement.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });
  });

  it('should have the Operations Overview heading', () => {
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('Operations Overview');
  });
});
