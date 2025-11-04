import type { App } from 'vue'
import { supabaseClient } from '../db/supabase.client.js'

export default {
  install(app: App) {
    app.config.globalProperties.$supabase = supabaseClient
  },
}

