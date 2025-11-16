a z-- Migration: Drop User Foreign Key Constraints
-- Purpose: Temporarily remove foreign key constraints on user_id columns for development
-- Tables affected: activities, goals, ai_suggestions
-- Author: Database Migration
-- Date: 2025-11-15
-- Notes: This is a temporary migration for development purposes.
--        It allows inserting test data without requiring real users in auth.users.
--        These constraints should be re-enabled before production deployment.
--        WARNING: Without these constraints, data integrity is not enforced at database level.

-- ============================================================================
-- SECTION 1: DROP FOREIGN KEY FOR ACTIVITIES TABLE
-- ============================================================================

-- Drop the foreign key constraint linking activities.user_id to auth.users.id
alter table activities
  drop constraint if exists activities_user_id_fkey;

-- Add comment explaining why this constraint was removed
comment on column activities.user_id is 'References user who performed this activity (FK temporarily removed for development)';

-- ============================================================================
-- SECTION 2: DROP FOREIGN KEY FOR GOALS TABLE
-- ============================================================================

-- Drop the foreign key constraint linking goals.user_id to auth.users.id
alter table goals
  drop constraint if exists goals_user_id_fkey;

-- Add comment explaining why this constraint was removed
comment on column goals.user_id is 'References user who owns this goal (FK temporarily removed for development)';

-- ============================================================================
-- SECTION 3: DROP FOREIGN KEY FOR AI_SUGGESTIONS TABLE
-- ============================================================================

-- Drop the foreign key constraint linking ai_suggestions.user_id to auth.users.id
alter table ai_suggestions
  drop constraint if exists ai_suggestions_user_id_fkey;

-- Add comment explaining why this constraint was removed
comment on column ai_suggestions.user_id is 'References user receiving this suggestion (FK temporarily removed for development)';

-- ============================================================================
-- SECTION 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Even without foreign keys, indexes on user_id columns are important for query performance
-- These indexes may already exist, but we ensure they're present

create index if not exists idx_activities_user_id on activities (user_id);
create index if not exists idx_goals_user_id on goals (user_id);
create index if not exists idx_ai_suggestions_user_id on ai_suggestions (user_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- TODO: Before production deployment, re-enable these foreign key constraints:
-- ALTER TABLE activities ADD CONSTRAINT activities_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE ai_suggestions ADD CONSTRAINT ai_suggestions_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

