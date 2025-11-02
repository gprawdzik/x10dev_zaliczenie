import { App } from 'vue'
import { supabaseClient } from '../db/supabase.client'

export default {
  install(app: App) {
    app.config.globalProperties.$supabase = supabaseClient
  },
}

