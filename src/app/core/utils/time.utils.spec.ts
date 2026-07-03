import { checkTimeOverlap, isoToSeconds, parseIsoDuration, secondsToTimeString, timeStringToIso8601, timeToSeconds } from './time.utils';

// ── secondsToTimeString ──────────────────────────────────────────────────────

describe('secondsToTimeString', () => {
  it('converts 0 to "00:00"',      () => expect(secondsToTimeString(0)).toBe('00:00'));
  it('converts 3600 to "01:00"',   () => expect(secondsToTimeString(3600)).toBe('01:00'));
  it('converts 5400 to "01:30"',   () => expect(secondsToTimeString(5400)).toBe('01:30'));
  it('converts 10800 to "03:00"',  () => expect(secondsToTimeString(10800)).toBe('03:00'));
  it('converts 12600 to "03:30"',  () => expect(secondsToTimeString(12600)).toBe('03:30'));
  it('pads hours below 10',        () => expect(secondsToTimeString(1800)).toBe('00:30'));
  it('ignores remaining seconds',  () => expect(secondsToTimeString(3661)).toBe('01:01'));
});

// ── timeToSeconds ────────────────────────────────────────────────────────────

describe('timeToSeconds', () => {
  it('parses "01:30" (HH:mm) to 5400',     () => expect(timeToSeconds('01:30')).toBe(5400));
  it('parses "03:00:00" (HH:mm:ss) to 10800', () => expect(timeToSeconds('03:00:00')).toBe(10800));
  it('parses "00:00" to 0',                () => expect(timeToSeconds('00:00')).toBe(0));
  it('parses "01:30:30" to 5430',          () => expect(timeToSeconds('01:30:30')).toBe(5430));
  it('returns null for empty string',      () => expect(timeToSeconds('')).toBeNull());
  it('returns null for "abc"',             () => expect(timeToSeconds('abc')).toBeNull());
  it('returns null for partial "01"',      () => expect(timeToSeconds('01')).toBeNull());
  it('returns null for minutes > 59',      () => expect(timeToSeconds('01:60')).toBeNull());
  it('returns null for seconds > 59',      () => expect(timeToSeconds('01:00:60')).toBeNull());
});

// ── timeStringToIso8601 ──────────────────────────────────────────────────────

describe('timeStringToIso8601', () => {
  it('converts "01:30" to "PT5400S"',        () => expect(timeStringToIso8601('01:30')).toBe('PT5400S'));
  it('converts "03:00:00" to "PT10800S"',    () => expect(timeStringToIso8601('03:00:00')).toBe('PT10800S'));
  it('converts "00:00" to "PT0S"',           () => expect(timeStringToIso8601('00:00')).toBe('PT0S'));
  it('converts "01:30:30" to "PT5430S"',     () => expect(timeStringToIso8601('01:30:30')).toBe('PT5430S'));
  it('returns null for empty string',        () => expect(timeStringToIso8601('')).toBeNull());
  it('returns null for invalid format "abc"',() => expect(timeStringToIso8601('abc')).toBeNull());
  it('returns null for partial "01"',        () => expect(timeStringToIso8601('01')).toBeNull());
  it('returns null for minutes > 59',        () => expect(timeStringToIso8601('01:60')).toBeNull());
  it('returns null for seconds > 59',        () => expect(timeStringToIso8601('01:00:60')).toBeNull());
});

// ── isoToSeconds ─────────────────────────────────────────────────────────────

describe('isoToSeconds', () => {
  it('parses PT3600S  → 3600',   () => expect(isoToSeconds('PT3600S')).toBe(3600));
  it('parses PT10800S → 10800',  () => expect(isoToSeconds('PT10800S')).toBe(10800));
  it('parses PT1H30M  → 5400',   () => expect(isoToSeconds('PT1H30M')).toBe(5400));
  it('parses PT2H     → 7200',   () => expect(isoToSeconds('PT2H')).toBe(7200));
  it('parses PT45M    → 2700',   () => expect(isoToSeconds('PT45M')).toBe(2700));
  it('parses PT0S     → 0',      () => expect(isoToSeconds('PT0S')).toBe(0));
  it('returns null for null',    () => expect(isoToSeconds(null)).toBeNull());
  it('returns null for empty',   () => expect(isoToSeconds('')).toBeNull());
  it('returns null for garbage', () => expect(isoToSeconds('abc')).toBeNull());
});

// ── checkTimeOverlap ──────────────────────────────────────────────────────────

describe('checkTimeOverlap', () => {
  // Helper — builds minimal CorralDetail-compatible stubs
  const c = (min: string | null, max: string | null) => ({ minTime: min, maxTime: max });

  it('returns false for empty corral list', () =>
    expect(checkTimeOverlap(3600, 7200, [])).toBe(false));

  it('returns false when new range is entirely before existing', () =>
    expect(checkTimeOverlap(0, 3600, [c('PT3600S', 'PT7200S')])).toBe(false));

  it('returns false when new range is entirely after existing', () =>
    expect(checkTimeOverlap(7200, 10800, [c('PT3600S', 'PT7200S')])).toBe(false));

  it('returns false when new start equals existing end (exclusive upper bound)', () =>
    expect(checkTimeOverlap(7200, 10800, [c('PT3600S', 'PT7200S')])).toBe(false));

  it('returns false when new end equals existing start (exclusive lower touch)', () =>
    expect(checkTimeOverlap(0, 3600, [c('PT3600S', 'PT7200S')])).toBe(false));

  it('returns true when new range starts inside existing', () =>
    expect(checkTimeOverlap(5400, 9000, [c('PT3600S', 'PT7200S')])).toBe(true));

  it('returns true when new range ends inside existing', () =>
    expect(checkTimeOverlap(0, 5400, [c('PT3600S', 'PT7200S')])).toBe(true));

  it('returns true when new range fully contains existing', () =>
    expect(checkTimeOverlap(0, 10800, [c('PT3600S', 'PT7200S')])).toBe(true));

  it('returns true when new range is fully contained by existing', () =>
    expect(checkTimeOverlap(4000, 5000, [c('PT3600S', 'PT7200S')])).toBe(true));

  it('skips corrals that have only minTime set', () =>
    expect(checkTimeOverlap(3600, 7200, [c('PT3600S', null)])).toBe(false));

  it('skips corrals that have only maxTime set', () =>
    expect(checkTimeOverlap(3600, 7200, [c(null, 'PT7200S')])).toBe(false));

  it('skips corrals where both bounds are null', () =>
    expect(checkTimeOverlap(3600, 7200, [c(null, null)])).toBe(false));

  it('detects overlap against the second corral when first is clear', () =>
    expect(checkTimeOverlap(
      5400, 9000,
      [c('PT0S', 'PT3600S'), c('PT3600S', 'PT7200S')],
    )).toBe(true));

  it('returns false when all corrals are clear', () =>
    expect(checkTimeOverlap(
      7200, 10800,
      [c('PT0S', 'PT3600S'), c('PT3600S', 'PT7200S')],
    )).toBe(false));
});

// ── parseIsoDuration ─────────────────────────────────────────────────────────

describe('parseIsoDuration', () => {
  it('returns "--" for null',          () => expect(parseIsoDuration(null)).toBe('--'));
  it('returns "--" for undefined',     () => expect(parseIsoDuration(undefined)).toBe('--'));
  it('returns "--" for empty string',  () => expect(parseIsoDuration('')).toBe('--'));
  it('returns "--" for "PT0S"',        () => expect(parseIsoDuration('PT0S')).toBe('--'));
  it('converts PT3600S  → "1:00h"',   () => expect(parseIsoDuration('PT3600S')).toBe('1:00h'));
  it('converts PT10800S → "3:00h"',   () => expect(parseIsoDuration('PT10800S')).toBe('3:00h'));
  it('converts PT5400S  → "1:30h"',   () => expect(parseIsoDuration('PT5400S')).toBe('1:30h'));
  it('converts PT1H30M  → "1:30h"',   () => expect(parseIsoDuration('PT1H30M')).toBe('1:30h'));
  it('converts PT2H     → "2:00h"',   () => expect(parseIsoDuration('PT2H')).toBe('2:00h'));
  it('converts PT45M    → "0:45h"',   () => expect(parseIsoDuration('PT45M')).toBe('0:45h'));
});
