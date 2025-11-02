-- Migration: Disable RLS Policies for Core Tables
-- Purpose: Drop all RLS policies from sports, goals, goal_history, and activities tables
-- Tables affected: sports, goals, goal_history, activities
-- Author: Database Migration
-- Date: 2025-11-02
-- Notes: This migration removes all previously defined RLS policies for the specified tables.
--        RLS remains enabled on the tables, but no policies are active.

-- ============================================================================
-- SECTION 1: DROP POLICIES FOR SPORTS TABLE
-- ============================================================================

-- Drop all sports table policies
drop policy if exists sports_select_anon on sports;
drop policy if exists sports_select_authenticated on sports;
drop policy if exists sports_insert_authenticated on sports;
drop policy if exists sports_update_authenticated on sports;
drop policy if exists sports_delete_authenticated on sports;

-- ============================================================================
-- SECTION 2: DROP POLICIES FOR GOALS TABLE
-- ============================================================================

-- Drop all goals table policies
drop policy if exists goals_select_authenticated on goals;
drop policy if exists goals_insert_authenticated on goals;
drop policy if exists goals_update_authenticated on goals;
drop policy if exists goals_delete_authenticated on goals;

-- ============================================================================
-- SECTION 3: DROP POLICIES FOR GOAL_HISTORY TABLE
-- ============================================================================

-- Drop all goal_history table policies
drop policy if exists goal_history_select_authenticated on goal_history;
drop policy if exists goal_history_insert_authenticated on goal_history;

-- ============================================================================
-- SECTION 4: DROP POLICIES FOR ACTIVITIES TABLE
-- ============================================================================

-- Drop all activities table policies
drop policy if exists activities_select_authenticated on activities;
drop policy if exists activities_insert_authenticated on activities;
drop policy if exists activities_update_authenticated on activities;
drop policy if exists activities_delete_authenticated on activities;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================


