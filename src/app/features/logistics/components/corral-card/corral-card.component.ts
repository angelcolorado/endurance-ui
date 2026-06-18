import { Component, computed, input } from '@angular/core';
import { CorralDetail } from '../../../../core/models/logistics.model';
import { parseIsoDuration } from '../../../../core/services/logistics.service';

@Component({
  selector: 'app-corral-card',
  standalone: true,
  templateUrl: './corral-card.component.html',
})
export class CorralCardComponent {
  readonly corral = input.required<CorralDetail>();

  readonly timeRange = computed(() => {
    const { minTime, maxTime } = this.corral();
    const min = parseIsoDuration(minTime);
    const max = parseIsoDuration(maxTime);
    if (min === '--' && max === '--') return '--';
    if (min === '--') return `≤ ${max}`;
    if (max === '--') return `≥ ${min}`;
    return `${min} – ${max}`;
  });

  readonly occupancyPercent = computed(() => {
    const { registeredCount, maxCapacity } = this.corral();
    if (!maxCapacity) return 0;
    return Math.min(100, Math.round((registeredCount / maxCapacity) * 100));
  });

  readonly cardBorderClass = computed(() => {
    if (this.corral().isParaAthleteCorral) return 'border-purple-500/50';
    if (this.corral().isRestricted)        return 'border-amber-500/40';
    return 'border-slate-700/60';
  });

  readonly occupancyBarClass = computed(() => {
    const pct = this.occupancyPercent();
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  });
}
