-- Migration: Restrict sports mutations to admins
-- Purpose: Ensure only administrators can insert/update/delete sports
-- Date: 2025-12-06
-- Notes:
--  - Reads admin flag from JWT app_metadata:
--      * app_metadata.role = 'admin' OR
--      * app_metadata.roles array contains 'admin' OR
--      * app_metadata.is_admin = true
--  - Select policies remain unchanged (public read).

-- Helper: checks whether current JWT belongs to an administrator
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  with claims as (
    select auth.jwt() as jwt
  )
  select coalesce(
    (claims.jwt -> 'app_metadata' ->> 'role') = 'admin'
      or ((claims.jwt -> 'app_metadata' -> 'roles') ? 'admin')
      or (claims.jwt -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  )
  from claims;
$$;

comment on function public.is_admin() is 'Returns true when JWT app_metadata marks user as admin.';

-- Drop previous broad mutation policies
drop policy if exists sports_insert_authenticated on sports;
drop policy if exists sports_update_authenticated on sports;
drop policy if exists sports_delete_authenticated on sports;

-- Admin-only insert
create policy sports_insert_admin on sports
  for insert
  to authenticated
  with check (public.is_admin());

-- Admin-only update
create policy sports_update_admin on sports
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin-only delete
create policy sports_delete_admin on sports
  for delete
  to authenticated
  using (public.is_admin());


