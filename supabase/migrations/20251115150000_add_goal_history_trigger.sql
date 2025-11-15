-- Migration: Add trigger to capture goal history changes
-- Purpose: Ensure updates to goals append previous values into goal_history
-- Tables affected: goals, goal_history
-- Author: GPT-5.1 Codex
-- Date: 2025-11-15

-- ============================================================================
-- SECTION 1: HELPER FUNCTION
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
      previous_metric_type,
      previous_target_value,
      changed_at
    )
    values (
      OLD.id,
      OLD.metric_type,
      OLD.target_value,
      now()
    );
  end if;

  return NEW;
end;
$$;

comment on function public.log_goal_history_change()
  is 'Trigger helper that stores the previous metric/target whenever a goal row is updated.';

-- ============================================================================
-- SECTION 2: TRIGGER
-- ============================================================================

drop trigger if exists trg_goals_log_history on goals;

create trigger trg_goals_log_history
after update on goals
for each row
when (
  OLD.metric_type is distinct from NEW.metric_type
  or OLD.target_value is distinct from NEW.target_value
)
execute function public.log_goal_history_change();

comment on trigger trg_goals_log_history on goals
  is 'Appends the previous metric and target values to goal_history whenever a goal changes.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

