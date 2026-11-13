import { evidence } from './evidence';

export const nasa = {
  heart: evidence.cardiovascular,
  behavior: 'https://www.nasa.gov/hrp/hazard-isolation-and-confinement/',
  hazards: evidence.hazards,
};

export const metrics = [
  { id: 'heart', name: 'Heart Rate', unit: 'bpm', min: 1, max: 300, step: 1, color: '#cbcbcb', help: 'Enter your measured pulse in beats per minute.', source: nasa.heart },
  { id: 'sleep', name: 'Sleep Duration', unit: 'h', min: 0, max: 24, step: 0.1, color: '#a4a4a4', help: 'Enter total hours slept in the past day. Use a decimal for partial hours.', source: evidence.archer },
  { id: 'fatigue', name: 'Fatigue Level', unit: '/ 5', min: 1, max: 5, step: 1, color: '#bababa', help: 'Rate your fatigue from 1 (very low) to 5 (very high).', source: nasa.behavior },
  { id: 'mood', name: 'Mood Level', unit: '/ 5', min: 1, max: 5, step: 1, color: '#a8a8a8', help: 'Rate your mood from 1 (very low) to 5 (very good).', source: nasa.behavior },
] as const;

export type Metric = typeof metrics[number];
export type MetricId = Metric['id'];
export type CheckIn = Record<MetricId, number> & {
  day: number;
  recordedAt: string;
  notes: string;
  followUp: boolean;
  source: 'manual' | 'simulated';
};

const demo: CheckIn[] = [
  [71, 8.1, 2, 4], [72, 7.8, 2, 5], [70, 8, 1, 4], [74, 7.4, 2, 4],
  [73, 7.1, 3, 4], [75, 6.8, 3, 3], [74, 6.2, 4, 4],
].map(([heart, sleep, fatigue, mood], index) => ({
  heart, sleep, fatigue, mood,
  day: index + 12,
  recordedAt: new Date(Date.UTC(2026, 10, 8 + index, 9, 15)).toISOString(),
  notes: '',
  followUp: false,
  source: 'simulated',
}));

export function readCheckIns(snapshot: string | null): CheckIn[] {
  if (snapshot === null) return demo;
  const records: unknown = JSON.parse(snapshot);
  if (!Array.isArray(records) || !records.every(record => record
    && Number.isInteger(record.day)
    && typeof record.recordedAt === 'string'
    && Number.isFinite(Date.parse(record.recordedAt))
    && typeof record.notes === 'string'
    && typeof record.followUp === 'boolean'
    && metrics.every(metric => typeof record[metric.id] === 'number'
      && record[metric.id] >= metric.min && record[metric.id] <= metric.max))) {
    throw new Error('Stored check-ins could not be read. Load the demo scenario to reset them.');
  }
  return records.map(record => ({
    ...record,
    source: record.source === 'manual' || record.source === 'simulated'
      ? record.source
      : demo.some(entry => entry.day === record.day && entry.recordedAt === record.recordedAt) ? 'simulated' : 'manual',
  }));
}

const key = 'beyond-check-ins-v1';
const change = 'beyond-check-ins-change';

export const checkInRepository = {
  snapshot() {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  subscribe(listener: () => void) {
    window.addEventListener(change, listener);
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener(change, listener);
      window.removeEventListener('storage', listener);
    };
  },
  save(values: Record<MetricId, number>, notes: string, followUp: boolean) {
    const records = readCheckIns(localStorage.getItem(key));
    const entry: CheckIn = { ...values, day: (records.at(-1)?.day ?? 0) + 1, recordedAt: new Date().toISOString(), notes, followUp, source: 'manual' };
    localStorage.setItem(key, JSON.stringify([...records, entry]));
    window.dispatchEvent(new Event(change));
    return entry;
  },
  loadDemo() {
    localStorage.setItem(key, JSON.stringify(demo));
    window.dispatchEvent(new Event(change));
  },
};

export function needsReview(id: MetricId, value: number, previous?: number) {
  return (id === 'sleep' && previous !== undefined && value < previous - .4)
    || (id === 'fatigue' && value >= 4)
    || (id === 'mood' && value <= 2)
    || (id === 'heart' && previous !== undefined && Math.abs(value - previous) >= 10);
}

export function readMeasurements(form: FormData) {
  const values = {} as Record<MetricId, number>;
  for (const metric of metrics) {
    const raw = form.get(metric.id);
    if (typeof raw !== 'string' || !raw.trim()) throw new Error(`Enter ${metric.name.toLowerCase()}.`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < metric.min || value > metric.max || Math.abs(value / metric.step - Math.round(value / metric.step)) > 1e-7) {
      throw new Error(`Enter a valid ${metric.name.toLowerCase()} from ${metric.min} to ${metric.max}.`);
    }
    values[metric.id] = value;
  }
  return values;
}
