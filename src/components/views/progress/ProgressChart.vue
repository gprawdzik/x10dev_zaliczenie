<script setup lang="ts">
import { computed, ref } from 'vue';

import SkeletonRow from './SkeletonRow.vue';
import { Button } from '@/components/ui/button/index.js';
import type { ProgressMetricType, ProgressSeriesVM } from '@/lib/view-models/progress.js';

interface Props {
  series: ProgressSeriesVM[];
  metricType: ProgressMetricType;
  year: number;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

const emit = defineEmits<{
  (e: 'retry'): void;
}>();

const hasData = computed(() => props.series.length > 0);
const metricLabel = computed(() => getMetricLabel(props.metricType));
const latestValueLabel = computed(() => formatValue(props.series.at(-1)?.value ?? 0, props.metricType));
const axisLabel = computed(() => getAxisLabel(props.metricType));
const totalDays = computed(() => getTotalDays(props.year));
const maxValue = computed(() => {
  if (!props.series.length) return 0;
  return Math.max(...props.series.map((p) => p.value), 0);
});

const svgRef = ref<SVGSVGElement | null>(null);
const activeIndex = ref(-1);

const seriesPoints = computed(() => {
  if (!props.series.length || maxValue.value <= 0 || totalDays.value <= 1) return [];
  const daysInYear = totalDays.value;
  return props.series.map((point) => {
    const dayIndex = clampDay(getDayOfYear(point.date, props.year), daysInYear);
    const x = (dayIndex / (daysInYear - 1)) * 100;
    const y =
      maxValue.value > 0 ? 50 - (point.value / maxValue.value) * 45 : 50;
    return { x, y, label: point.label, value: point.value };
  });
});

const activePoint = computed(() => {
  if (activeIndex.value < 0) return null;
  return seriesPoints.value[activeIndex.value] ?? null;
});

const activeValueLabel = computed(() =>
  activePoint.value ? formatValue(activePoint.value.value, props.metricType) : null
);
const activeDateLabel = computed(() => activePoint.value?.label ?? null);

const polylinePoints = computed(() => buildPolyline(seriesPoints.value));
const monthTicks = computed(() => {
  const labels = getMonths();
  const daysInYear = totalDays.value;
  return labels.map((label, index) => {
    const dayIndex = clampDay(getDayOfYearUtc(props.year, index, 1), daysInYear);
    return { label, x: (dayIndex / (daysInYear - 1)) * 100 };
  });
});

const monthGrid = computed(() => {
  const daysInYear = totalDays.value;
  return Array.from({ length: 13 }, (_, index) => {
    const dayIndex = clampDay(getDayOfYearUtc(props.year, index, 1), daysInYear);
    return { x: (dayIndex / (daysInYear - 1)) * 100 };
  });
});

const yTicks = computed(() => {
  if (maxValue.value <= 0) return [];
  const ratios = [1.04, 0.78, 0.52, 0.26];
  return ratios.map((ratio) => {
    const safeRatio = Math.max(ratio, 0);
    const y = Math.max(0, 50 - safeRatio * 45); // allow >100% to sit slightly above max
    const value = maxValue.value * ratio;
    return { y, ratio: safeRatio, value };
  });
});

function handleRetry() {
  emit('retry');
}

function handleMouseMove(event: MouseEvent) {
  const svg = svgRef.value;
  if (!svg || !seriesPoints.value.length) return;
  const rect = svg.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  if (!Number.isFinite(ratio)) return;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const targetX = clamped * 100;
  let closest = -1;
  let minDelta = Number.POSITIVE_INFINITY;
  seriesPoints.value.forEach((pt, idx) => {
    const delta = Math.abs(pt.x - targetX);
    if (delta < minDelta) {
      minDelta = delta;
      closest = idx;
    }
  });
  activeIndex.value = closest;
}

function handleMouseLeave() {
  activeIndex.value = -1;
}

function buildPolyline(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return '';
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function buildArea(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return '';
  const polyline = buildPolyline(points);
  if (!polyline) return '';
  const parsed = polyline
    .split(' ')
    .map((pair) => pair.split(',').map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (!parsed.length) return '';

  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  return [
    `${first[0]},50`,
    ...parsed.map(([x, y]) => `${x},${y}`),
    `${last[0]},50`,
  ].join(' ');
}

function getMetricLabel(metric: ProgressMetricType): string {
  switch (metric) {
    case 'distance':
      return 'Dystans (km)';
    case 'time':
      return 'Czas';
    case 'elevation_gain':
      return 'Przewyższenie';
    default:
      return 'Metryka';
  }
}

function getAxisLabel(metric: ProgressMetricType): string {
  switch (metric) {
    case 'distance':
      return 'Wartość (km)';
    case 'time':
      return 'Wartość (czas)';
    case 'elevation_gain':
      return 'Wartość (m)';
    default:
      return 'Wartość';
  }
}

function formatValue(value: number, metric: ProgressMetricType): string {
  if (!Number.isFinite(value) || value < 0) return '0';

  if (metric === 'distance') {
    return value >= 10 ? `${value.toFixed(0)} km` : `${value.toFixed(1)} km`;
  }

  if (metric === 'time') {
    const hours = value / 3600;
    if (hours >= 1) return `${hours.toFixed(1)} h`;
    return `${Math.round(value / 60)} min`;
  }

  return `${Math.round(value)} m`;
}

function getMonths(): string[] {
  return ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
}

function getTotalDays(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(dateString: string, year: number): number {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const start = Date.UTC(year, 0, 1);
  const diffMs = utcDate.getTime() - start;
  const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const total = getTotalDays(year);
  if (utcDate.getUTCFullYear() !== year) {
    return utcDate.getUTCFullYear() < year ? 0 : total - 1;
  }
  return dayIndex;
}

function getDayOfYearUtc(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month, day));
  const start = Date.UTC(year, 0, 1);
  const diffMs = date.getTime() - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function clampDay(dayIndex: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(Math.max(dayIndex, 0), total - 1);
}
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <p class="chart-eyebrow">Postępy {{ year }}</p>
        <p class="chart-title">Metryka: {{ metricLabel }}</p>
      </div>
    </div>

    <div v-if="loading" class="chart-body">
      <SkeletonRow variant="chart" />
    </div>

    <div v-else-if="error" class="chart-body error-state">
      <p class="error-text">{{ error }}</p>
      <Button variant="outline" size="sm" @click="handleRetry">Spróbuj ponownie</Button>
    </div>

    <div v-else-if="!hasData" class="chart-body empty-state">
      <p class="empty-text">Brak danych dla wybranych filtrów.</p>
    </div>

    <div v-else class="chart-body">
      <div class="chart-value">
        <span class="value-label">Wartość: {{ latestValueLabel }}</span>
      </div>
      <div class="chart-area-wrapper">
        <div class="y-axis-label" aria-hidden="true"></div>
        <div class="chart-svg-wrapper">
          <svg
            ref="svgRef"
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            class="chart-svg"
            role="img"
            aria-label="Wykres postępów"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <g class="h-grid" aria-hidden="true">
              <line
                v-for="tick in yTicks"
                :key="`h-${tick.y}`"
                x1="0"
                :y1="tick.y"
                x2="100"
                :y2="tick.y"
                vector-effect="non-scaling-stroke"
              />
            </g>
            <g class="grid-lines" aria-hidden="true">
              <line
                v-for="grid in monthGrid"
                :key="grid.x"
                :x1="grid.x"
                y1="0"
                :x2="grid.x"
                y2="50"
                vector-effect="non-scaling-stroke"
              />
            </g>
            <polyline
              v-if="polylinePoints"
              :points="polylinePoints"
              class="chart-line"
              vector-effect="non-scaling-stroke"
            />
            <line
              v-if="activePoint"
              class="hover-line"
              :x1="activePoint.x"
              y1="0"
              :x2="activePoint.x"
              y2="50"
            />
            <circle
              v-if="activePoint"
              class="hover-dot"
              :cx="activePoint.x"
              :cy="activePoint.y"
              r="0.9"
            />
          </svg>
          <div class="y-axis-ticks" aria-hidden="true">
            <span
              v-for="tick in yTicks"
              :key="`yt-${tick.y}`"
              class="y-tick"
              :style="{ top: `${(tick.y / 50) * 100}%` }"
            >
              {{ formatValue(tick.value, props.metricType) }}
            </span>
          </div>
          <div class="x-axis" aria-hidden="true">
            <span v-for="tick in monthTicks" :key="tick.label" class="x-tick" :style="{ left: `${tick.x}%` }">
              {{ tick.label }}
            </span>
          </div>
          <div v-if="activePoint" class="tooltip" :style="{ left: `${activePoint.x}%` }">
            <p class="tooltip-date">{{ activeDateLabel }}</p>
            <p class="tooltip-value">{{ activeValueLabel }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../../assets/base.css";

.chart-card {
  @apply rounded-xl border border-border bg-card/50 p-4 shadow-sm;
}

.chart-header {
  @apply flex flex-col justify-between gap-3 md:flex-row md:items-center;
}

.chart-eyebrow {
  @apply text-xs uppercase tracking-wide text-muted-foreground;
}

.chart-title {
  @apply text-lg font-semibold text-foreground;
}

.chart-body {
  @apply mt-4;
  @apply space-y-3;
}

.chart-value {
  @apply text-sm text-muted-foreground;
}

.value-label {
  @apply inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 font-medium text-foreground;
}

.chart-svg {
  @apply h-64 w-full;
}

.chart-line {
  fill: none;
  stroke: #2563eb; /* force visible blue */
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-opacity: 0.95;
  filter: drop-shadow(0 0 1px rgba(37, 99, 235, 0.35));
}

.chart-area-wrapper {
  @apply grid items-stretch gap-3;
  grid-template-columns: auto 1fr;
}

.chart-svg-wrapper {
  position: relative;
}

.grid-lines line {
  stroke: #cbd5e1; /* slate-300 */
  stroke-width: 1;
  stroke-dasharray: 4 3;
  opacity: 1;
}

.h-grid line {
  stroke: #cbd5e1;
  stroke-width: 1;
  stroke-dasharray: 4 3;
  opacity: 1;
}

.hover-line {
  stroke: hsl(var(--muted-foreground) / 0.5);
  stroke-width: 0.6;
}

.hover-dot {
  fill: hsl(var(--primary));
  stroke: hsl(var(--background));
  stroke-width: 0.4;
}

.x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1.75rem;
  @apply text-[0.7rem] text-muted-foreground;
}

.x-tick {
  position: absolute;
  transform: translateX(-50%);
}

.y-axis-ticks {
  position: absolute;
  left: -0.75rem;
  top: 0;
  bottom: 0;
  width: 3rem;
  pointer-events: none;
  @apply text-[0.7rem] text-muted-foreground;
}

.y-tick {
  position: absolute;
  transform: translateY(-50%);
  left: 0;
}

.tooltip {
  position: absolute;
  top: 0.5rem;
  transform: translateX(-50%);
  @apply min-w-[120px] rounded-md bg-background/95 px-3 py-2 text-xs shadow-lg ring-1 ring-border;
  pointer-events: none;
}

.tooltip-date {
  @apply text-muted-foreground;
}

.tooltip-value {
  @apply font-semibold text-foreground;
}

.y-grid-labels {
  pointer-events: none;
}

.y-grid-text {
  font-size: 2.8px;
  fill: hsl(var(--muted-foreground));
  text-anchor: start;
  dominant-baseline: middle;
}

.y-axis-label {
  @apply text-[0.7rem] text-muted-foreground;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-state,
.empty-state {
  @apply flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-4;
}

.error-text {
  @apply text-sm text-destructive;
}

.empty-text {
  @apply text-sm text-muted-foreground;
}
</style>


