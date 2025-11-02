-- Migration: Initial Schema for StravaGoals Application
-- Purpose: Create all core tables, enums, indexes, and RLS policies
-- Tables affected: sports, goals, goal_history, activities, ai_suggestions
-- Author: Database Generator
-- Date: 2025-11-02
-- Notes: This migration establishes the complete database schema for tracking
--        user goals, activities, and AI suggestions with proper security policies.

-- ============================================================================
-- SECTION 1: ENUMERATIONS
-- ============================================================================

-- Create enum for goal scope types
-- This determines if a goal applies globally or to a specific sport
create type goal_scope_type as enum ('global', 'per_sport');

-- Create enum for goal metric types
-- These are the measurable aspects users can set goals for
create type goal_metric_type as enum ('distance', 'time', 'elevation_gain');

-- Create enum for AI suggestion statuses
-- Tracks the lifecycle of AI-generated suggestions
create type suggestion_status as enum ('pending', 'accepted', 'rejected');

-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- sports table
-- Stores available sport types that can be tracked in the system
-- Consolidated field contains additional metadata in JSON format
-- ----------------------------------------------------------------------------
create table sports (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  consolidated jsonb
);

-- Add comment explaining the sports table purpose
comment on table sports is 'Stores sport types available in the system for activity categorization';
comment on column sports.code is 'Unique identifier code for the sport (e.g., RUN, RIDE)';
comment on column sports.consolidated is 'Additional sport metadata stored as JSON';

-- ----------------------------------------------------------------------------
-- goals table
-- Stores user-defined annual training goals
-- Each goal targets a specific metric (distance, time, or elevation)
-- ----------------------------------------------------------------------------
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_id uuid references sports(id) on delete cascade,
  scope_type goal_scope_type not null,
  year integer not null,
  metric_type goal_metric_type not null,
  target_value numeric not null check (target_value >= 0),
  created_at timestamp with time zone default now()
);

-- Add comments explaining the goals table
comment on table goals is 'Stores user-defined annual training goals with specific metrics and targets';
comment on column goals.user_id is 'References the user who owns this goal';
comment on column goals.sport_id is 'Optional reference to specific sport; null for global goals';
comment on column goals.scope_type is 'Indicates if goal is global or sport-specific';
comment on column goals.year is 'The calendar year this goal applies to';
comment on column goals.metric_type is 'The type of metric being tracked (distance, time, elevation)';
comment on column goals.target_value is 'The numeric target value to achieve';

-- ----------------------------------------------------------------------------
-- goal_history table
-- Tracks changes to goals over time for audit and historical analysis
-- Records previous values when a goal is modified
-- ----------------------------------------------------------------------------
create table goal_history (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  previous_metric_type goal_metric_type not null,
  previous_target_value numeric not null check (previous_target_value >= 0),
  changed_at timestamp with time zone default now()
);

-- Add comments explaining the goal_history table
comment on table goal_history is 'Audit trail of goal modifications, storing previous values';
comment on column goal_history.goal_id is 'References the goal that was modified';
comment on column goal_history.previous_metric_type is 'The metric type before the change';
comment on column goal_history.previous_target_value is 'The target value before the change';

-- ----------------------------------------------------------------------------
-- activities table
-- Stores user training activities (similar to Strava activities)
-- Contains detailed metrics about each workout or training session
-- ----------------------------------------------------------------------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  sport_type text not null,
  start_date timestamp with time zone not null,
  start_date_local timestamp with time zone not null,
  timezone text not null,
  utc_offset integer not null,
  distance numeric not null check (distance >= 0),
  moving_time interval not null,
  elapsed_time interval not null,
  total_elevation_gain numeric not null check (total_elevation_gain >= 0),
  average_speed numeric not null check (average_speed >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comments explaining the activities table
comment on table activities is 'Stores detailed user training activities and workout data';
comment on column activities.user_id is 'References the user who performed this activity';
comment on column activities.name is 'User-provided name/title for the activity';
comment on column activities.type is 'Activity type classification';
comment on column activities.sport_type is 'Specific sport classification for the activity';
comment on column activities.start_date is 'Activity start time in UTC';
comment on column activities.start_date_local is 'Activity start time in local timezone';
comment on column activities.distance is 'Total distance covered in meters';
comment on column activities.moving_time is 'Time spent actively moving';
comment on column activities.elapsed_time is 'Total elapsed time including pauses';
comment on column activities.total_elevation_gain is 'Total elevation climbed in meters';
comment on column activities.average_speed is 'Average speed in meters per second';

-- ----------------------------------------------------------------------------
-- ai_suggestions table
-- Stores AI-generated suggestions for goals
-- Tracks suggestion status and performance metrics
-- ----------------------------------------------------------------------------
create table ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggestion_data jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status suggestion_status not null,
  response_time_ms integer not null check (response_time_ms >= 0),
  error_message text
);

-- Add comments explaining the ai_suggestions table
comment on table ai_suggestions is 'Stores AI-generated goal suggestions with tracking metadata';
comment on column ai_suggestions.user_id is 'References the user receiving this suggestion';
comment on column ai_suggestions.suggestion_data is 'JSON payload containing the AI-generated suggestion';
comment on column ai_suggestions.status is 'Current status of the suggestion (pending, accepted, rejected)';
comment on column ai_suggestions.response_time_ms is 'AI response time in milliseconds for performance monitoring';
comment on column ai_suggestions.error_message is 'Error details if suggestion generation failed';

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Index for efficient activity queries filtered by user and date
-- Supports common queries that fetch user activities within date ranges
create index idx_activities_user_start_date on activities (user_id, start_date);

-- Index for efficient goal queries filtered by user and year
-- Supports queries fetching all goals for a user in a specific year
create index idx_goals_user_year on goals (user_id, year);

-- Index for efficient AI suggestion queries by user, status, and date
-- Supports queries fetching pending/accepted/rejected suggestions chronologically
create index idx_ai_suggestions_user_status_created on ai_suggestions (user_id, status, created_at);

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables to ensure data isolation
-- Even for tables with simple policies, RLS must be explicitly enabled
alter table sports enable row level security;
alter table goals enable row level security;
alter table goal_history enable row level security;
alter table activities enable row level security;
alter table ai_suggestions enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies for sports table
-- Sports are publicly readable by all users (both authenticated and anonymous)
-- Only authenticated users can create/modify sports (admin functionality)
-- ----------------------------------------------------------------------------

-- Allow anonymous users to read all sports
create policy sports_select_anon on sports
  for select
  to anon
  using (true);

-- Allow authenticated users to read all sports
create policy sports_select_authenticated on sports
  for select
  to authenticated
  using (true);

-- Allow authenticated users to insert sports
create policy sports_insert_authenticated on sports
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update sports
create policy sports_update_authenticated on sports
  for update
  to authenticated
  using (true)
  with check (true);

-- Allow authenticated users to delete sports
create policy sports_delete_authenticated on sports
  for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- RLS Policies for goals table
-- Users can only access their own goals
-- Each operation (select, insert, update, delete) has separate policies
-- ----------------------------------------------------------------------------

-- Allow authenticated users to select only their own goals
create policy goals_select_authenticated on goals
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert goals for themselves
create policy goals_insert_authenticated on goals
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update only their own goals
create policy goals_update_authenticated on goals
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete only their own goals
create policy goals_delete_authenticated on goals
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies for goal_history table
-- Users can access goal history only for goals they own
-- History entries are read-only to preserve audit trail integrity
-- ----------------------------------------------------------------------------

-- Allow authenticated users to select goal history for their own goals
create policy goal_history_select_authenticated on goal_history
  for select
  to authenticated
  using (
    exists (
      select 1 from goals
      where goals.id = goal_history.goal_id
        and goals.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert goal history for their own goals
create policy goal_history_insert_authenticated on goal_history
  for insert
  to authenticated
  with check (
    exists (
      select 1 from goals
      where goals.id = goal_history.goal_id
        and goals.user_id = auth.uid()
    )
  );

-- Note: No update or delete policies for goal_history
-- History records should be immutable once created for audit integrity

-- ----------------------------------------------------------------------------
-- RLS Policies for activities table
-- Users can only access their own activities
-- Full CRUD operations allowed on own activities
-- ----------------------------------------------------------------------------

-- Allow authenticated users to select only their own activities
create policy activities_select_authenticated on activities
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert activities for themselves
create policy activities_insert_authenticated on activities
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update only their own activities
create policy activities_update_authenticated on activities
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete only their own activities
create policy activities_delete_authenticated on activities
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies for ai_suggestions table
-- Users can only access their own AI suggestions
-- Full CRUD operations allowed on own suggestions
-- ----------------------------------------------------------------------------

-- Allow authenticated users to select only their own suggestions
create policy ai_suggestions_select_authenticated on ai_suggestions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert suggestions for themselves
create policy ai_suggestions_insert_authenticated on ai_suggestions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update only their own suggestions
create policy ai_suggestions_update_authenticated on ai_suggestions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete only their own suggestions
create policy ai_suggestions_delete_authenticated on ai_suggestions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to activities table to auto-update updated_at
create trigger update_activities_updated_at
  before update on activities
  for each row
  execute function update_updated_at_column();

-- Add trigger to ai_suggestions table to auto-update updated_at
create trigger update_ai_suggestions_updated_at
  before update on ai_suggestions
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

