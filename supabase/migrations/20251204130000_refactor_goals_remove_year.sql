-- Migration: Refactor Goals - Remove Year Column
-- Purpose: Remove year column from goals table and update goal_history table
-- Tables affected: goals, goal_history
-- Author: Database Generator
-- Date: 2025-12-04
-- Notes: This migration removes the year field from goals and updates goal_history
--        to no longer track year changes. Updates are now restricted to target_value only.

-- ============================================================================
-- SECTION 1: MODIFY TABLES
-- ============================================================================

-- Remove year column from goals table
alter table goals drop column year;

-- Update goal_history table to remove previous_year column (if it exists)
-- and modify the structure to only track target_value changes
alter table goal_history
  drop column if exists previous_year,
  drop column previous_metric_type,
  add column if not exists previous_target_value numeric not null check (previous_target_value >= 0);

-- ============================================================================
-- SECTION 2: UPDATE INDEXES
-- ============================================================================

-- Drop the old index that included year
drop index if exists idx_goals_user_year;

-- Create new index without year
create index idx_goals_user_created_at on goals (user_id, created_at);

-- ============================================================================
-- SECTION 3: UPDATE COMMENTS
-- ============================================================================

-- Update goals table comment
comment on table goals is 'Stores user-defined training goals with specific metrics and targets (no longer year-specific)';

-- Update goal_history table comment
comment on table goal_history is 'Audit trail of goal target value modifications';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
