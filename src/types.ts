import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types.js";

// Sport DTOs
export type SportDto = Tables<"sports">;
export type CreateSportDto = Omit<TablesInsert<"sports">, "id">;

// Goal DTOs
export type GoalDto = Tables<"goals">;
export type CreateGoalDto = Omit<TablesInsert<"goals">, "id" | "created_at" | "user_id">;
export type UpdateGoalDto = Partial<Pick<TablesUpdate<"goals">, "metric_type" | "target_value">>;

// Goal History DTO
export type GoalHistoryDto = Tables<"goal_history">;

// Activity DTOs
export type ActivityDto = Tables<"activities">;
export type GenerateActivitiesRequest = Partial<{
  primary_sports: string[];
  distribution: { primary: number; secondary: number; tertiary: number; quaternary: number };
  timezone: string;
}>;
export type GenerateActivitiesResponse = { created_count: number };
export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

export const ACTIVITY_SORTABLE_FIELDS = ['start_date', 'distance', 'moving_time'] as const;
export type ActivitySortField = (typeof ACTIVITY_SORTABLE_FIELDS)[number];

export const ACTIVITY_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type ActivitySortDirection = (typeof ACTIVITY_SORT_DIRECTIONS)[number];

export type SortOption = {
  value: ActivitySortField;
  label: string;
};

export type ActivitiesSortState = {
  sortBy: ActivitySortField;
  sortDir: ActivitySortDirection;
};

export type ActivityViewModel = {
  id: string;
  name: string;
  type: string;
  startDate: string;
  distance: string;
  duration: string;
  elevation: string;
  pace: string;
};

// Progress/Stats DTOs
export type ProgressAnnualRequest = {
  year: number;
  metric_type: Enums<"goal_metric_type">;
  sport_id: string | null;
};
export type ProgressAnnualSeries = { date: string; value: number };
export type ProgressAnnualResponse = {
  year: number;
  metric_type: Enums<"goal_metric_type">;
  scope_type: Enums<"goal_scope_type">;
  series: ProgressAnnualSeries[];
  target_value: number;
};
export type ProgressHistoryRequest = {
  years: number[];
  metric_type: Enums<"goal_metric_type">;
  sport_id: string | null;
};
export type ProgressHistoryItem = { year: number; value: number };
export type ProgressHistoryResponse = ProgressHistoryItem[];

// AI Suggestions DTOs
export type SuggestionDataDto = {
  year: number;
  scope_type: Enums<"goal_scope_type">;
  sport_id: string;
  metric_type: Enums<"goal_metric_type">;
  target_value: number;
};
export type AiSuggestionDto = Omit<Tables<"ai_suggestions">, "suggestion_data"> & { suggestion_data: SuggestionDataDto };
export type GenerateAiSuggestionsRequest = { lookback_days: number };
export type GenerateAiSuggestionsResponse = { suggestions: AiSuggestionDto[] };
export type AcceptSuggestionRequest = { suggestion_id: string };
export type AcceptSuggestionResponse = { updated_goal_id: string; status: Enums<"suggestion_status"> };
export type RejectSuggestionRequest = { suggestion_id: string };
export type RejectSuggestionResponse = { status: Enums<"suggestion_status"> };

// Error DTO
export type ErrorDto = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
