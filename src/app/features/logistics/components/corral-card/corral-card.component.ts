import { Component, computed, input } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { CorralDetail } from '../../../../core/models/logistics.model';
import { parseIsoDuration } from '../../../../core/utils/time.utils';

@Component({
  selector: 'app-corral-card',
  standalone: true,
  imports: [CdkDragHandle],
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
    return Math.min(100, Math.round(((registeredCount ?? 0) / maxCapacity) * 100));
  });

  readonly accentClass = computed(() => {
    if (this.corral().isParaAthleteCorral) return 'border-l-purple-500';
    if (this.corral().isRestricted)        return 'border-l-amber-500';
    return 'border-l-slate-600';
  });

  readonly occupancyBarClass = computed(() => {
    const pct = this.occupancyPercent();
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-400';
    return 'bg-emerald-500';
  });

  readonly isOpenCapacity = computed(() => !this.corral().maxCapacity);
}
