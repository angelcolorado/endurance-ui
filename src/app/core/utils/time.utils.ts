/**
 * Parses 'HH:mm' or 'HH:mm:ss' into total seconds.
 * Returns null for empty input, wrong segment count, non-numeric parts,
 * or out-of-range minutes / seconds (> 59).
 */
export function timeToSeconds(timeString: string): number | null {
  if (!timeString?.trim()) return null;
  const parts = timeString.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  if ([h, m, s].some(n => isNaN(n)) || m > 59 || s > 59 || h < 0) return null;
  return h * 3600 + m * 60 + s;
}

/**
 * Converts 'HH:mm' or 'HH:mm:ss' to an ISO 8601 duration string (e.g. 'PT5400S').
 * Returns null for empty, invalid format, or out-of-range values.
 */
export function timeStringToIso8601(timeString: string): string | null {
  const seconds = timeToSeconds(timeString);
  return seconds !== null ? `PT${seconds}S` : null;
}

/**
 * Parses an ISO 8601 duration string (e.g. 'PT10800S', 'PT1H30M') to total seconds.
 * Returns null for null, empty, or unrecognised formats.
 */
export function isoToSeconds(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const hoursMatch   = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);
  if (!hoursMatch && !minutesMatch && !secondsMatch) return null;
  let total = 0;
  if (hoursMatch)   total += parseInt(hoursMatch[1], 10) * 3600;
  if (minutesMatch) total += parseInt(minutesMatch[1], 10) * 60;
  if (secondsMatch) total += parseInt(secondsMatch[1], 10);
  return total;
}

/**
 * Returns true when [newMinSec, newMaxSec) overlaps with any existing corral whose
 * minTime and maxTime are both set (ISO 8601). Bounds are [inclusive, exclusive):
 * a new range starting exactly at an existing range's end does NOT overlap.
 * Corrals missing either bound are skipped (open-ended ranges cannot conflict).
 */
export function checkTimeOverlap(
  newMinSec: number,
  newMaxSec: number,
  existingCorrals: { minTime: string | null; maxTime: string | null }[],
): boolean {
  for (const corral of existingCorrals) {
    const existMin = isoToSeconds(corral.minTime);
    const existMax = isoToSeconds(corral.maxTime);
    if (existMin === null || existMax === null) continue;
    // [newMin, newMax) overlaps [existMin, existMax) when newMin < existMax && newMax > existMin
    if (newMinSec < existMax && newMaxSec > existMin) return true;
  }
  return false;
}

/**
 * Converts an ISO 8601 duration (e.g. 'PT10800S', 'PT1H30M') to a human-readable
 * time string (e.g. '3:00h', '1:30h'). Returns '--' for null, empty, or 'PT0S'.
 */
export function parseIsoDuration(duration: string | null | undefined): string {
  if (!duration || duration === 'PT0S') return '--';

  const hoursMatch   = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);

  let totalSeconds = 0;
  if (hoursMatch)   totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);

  if (totalSeconds === 0) return '--';

  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${h}:${pad(m)}h`;
}
