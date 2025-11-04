import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.js';

export const onRequest = defineMiddleware((context, next) => {
  // Defensive: Check if supabaseClient exists and is properly initialized
  if (!supabaseClient) {
    console.error("Supabase client failed to import or initialize.");
    throw new Error("Supabase client is unavailable. Middleware cannot proceed.");
  }

  if (!context || !context.locals) {
    console.error("Astro middleware context or context.locals is undefined.");
    return next();
  }

  context.locals.supabase = supabaseClient;
  return next();
});

