-- Migration: Fix goal history trigger after removing previous_metric_type column
-- Purpose: Align trigger/function with simplified goal_history table structure
-- Author: GPT-5.1 Codex
-- Date: 2025-12-07

-- ============================================================================
-- SECTION 1: DROP OUTDATED TRIGGER & FUNCTION
-- ============================================================================

drop trigger if exists trg_goals_log_history on goals;
drop function if exists public.log_goal_history_change;

-- ============================================================================
-- SECTION 2: RECREATE FUNCTION WITHOUT PREVIOUS_METRIC_TYPE
-- ============================================================================

create or replace function public.log_goal_history_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    insert into goal_history (
      goal_id,
      previous_target_value,
      changed_at
    )
    values (
      OLD.id,
      OLD.target_value,
      now()
    );
  end if;

  return NEW;
end;
$$;

comment on function public.log_goal_history_change()
  is 'Trigger helper that stores the previous target whenever a goal row is updated.';

-- ============================================================================
-- SECTION 3: RECREATE TRIGGER WITH UPDATED CONDITION
-- ============================================================================

create trigger trg_goals_log_history
after update on goals
for each row
when (
  OLD.target_value is distinct from NEW.target_value
)
execute function public.log_goal_history_change();

comment on trigger trg_goals_log_history on goals
  is 'Appends the previous target value to goal_history whenever a goal changes.';

-- ============================================================================
-- SECTION 4: UPDATE goal_history COMMENT
-- ============================================================================

comment on table goal_history
  is 'Audit trail of goal modifications, storing previous target values.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

