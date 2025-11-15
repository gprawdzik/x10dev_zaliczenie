-- Migration: Disable RLS on Core Tables
-- Purpose: Disable Row Level Security on sports, goals, goal_history, and activities tables
-- Tables affected: sports, goals, goal_history, activities
-- Author: Database Migration
-- Date: 2025-11-15
-- Notes: This migration disables RLS on tables where policies were previously dropped.
--        With RLS enabled but no policies, all operations were being blocked.
--        Disabling RLS allows authenticated users to access data normally.

-- ============================================================================
-- SECTION 1: DISABLE RLS FOR SPORTS TABLE
-- ============================================================================

alter table sports disable row level security;

-- ============================================================================
-- SECTION 2: DISABLE RLS FOR GOALS TABLE
-- ============================================================================

alter table goals disable row level security;

-- ============================================================================
-- SECTION 3: DISABLE RLS FOR GOAL_HISTORY TABLE
-- ============================================================================

alter table goal_history disable row level security;

-- ============================================================================
-- SECTION 4: DISABLE RLS FOR ACTIVITIES TABLE
-- ============================================================================

alter table activities disable row level security;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

