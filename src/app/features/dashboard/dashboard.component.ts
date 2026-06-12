import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export type LogisticsStatus = 'Approved' | 'Under Review' | 'Pending';

export interface SummaryMetric {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  iconPath: string;
  accentBg: string;
  accentText: string;
}

export interface UpcomingEvent {
  name: string;
  date: string;
  registeredAthletes: number;
  logisticsStatus: LogisticsStatus;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly metrics = signal<SummaryMetric[]>([
    {
      title: 'Registered Athletes',
      value: '12,450',
      trend: '+3.2% vs last event',
      trendUp: true,
      iconPath:
        'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
      accentBg: 'bg-blue-600/20',
      accentText: 'text-blue-400',
    },
    {
      title: 'Active Waves',
      value: '8 Waves',
      trend: 'Stable',
      trendUp: true,
      iconPath:
        'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605',
      accentBg: 'bg-violet-600/20',
      accentText: 'text-violet-400',
    },
    {
      title: 'Corral Capacity',
      value: '94%',
      trend: '+2% vs target',
      trendUp: true,
      iconPath:
        'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
      accentBg: 'bg-emerald-600/20',
      accentText: 'text-emerald-400',
    },
    {
      title: 'Assigned Pacers',
      value: '45',
      trend: '-5 pending assignment',
      trendUp: false,
      iconPath:
        'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z',
      accentBg: 'bg-amber-600/20',
      accentText: 'text-amber-400',
    },
  ]);

  readonly upcomingEvents = signal<UpcomingEvent[]>([
    {
      name: 'EnduranceOps Monterrey 2026',
      date: 'Jun 28, 2026',
      registeredAthletes: 3200,
      logisticsStatus: 'Approved',
    },
    {
      name: 'Trail Ultra Bajío',
      date: 'Jul 12, 2026',
      registeredAthletes: 1850,
      logisticsStatus: 'Under Review',
    },
    {
      name: 'Marathon CDMX Classic',
      date: 'Aug 3, 2026',
      registeredAthletes: 7400,
      logisticsStatus: 'Pending',
    },
  ]);

  getBadgeClasses(status: LogisticsStatus): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Approved':
        return `${base} bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30`;
      case 'Under Review':
        return `${base} bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30`;
      case 'Pending':
        return `${base} bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30`;
    }
  }
}
