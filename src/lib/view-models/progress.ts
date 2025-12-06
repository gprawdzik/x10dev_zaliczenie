export type ProgressMetricType = 'distance' | 'time' | 'elevation_gain';

export type ProgressFilterState = {
  year: number;
  metric_type: ProgressMetricType;
  sport_id: string | null;
};

export type ProgressSeriesVM = {
  date: string;
  value: number;
  label: string;
};

export type ProgressChartVM = {
  series: ProgressSeriesVM[];
  targetValue: number;
  achieved: number;
  percent: number;
  metric: ProgressMetricType;
  year: number;
  scope: string;
};

export type GoalCardVM = {
  id: string;
  title: string;
  scopeLabel: string;
  metricLabel: string;
  targetValue: string;
  achievedValue: string;
  percent: number;
  year: number;
  sportId: string | null;
  scopeType: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

export type ProgressViewState = {
  chart?: ProgressChartVM;
  loading: boolean;
  error?: string | null;
};

