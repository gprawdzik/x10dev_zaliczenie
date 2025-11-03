export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          average_speed: number
          created_at: string | null
          distance: number
          elapsed_time: unknown
          id: string
          moving_time: unknown
          name: string
          sport_type: string
          start_date: string
          start_date_local: string
          timezone: string
          total_elevation_gain: number
          type: string
          updated_at: string | null
          user_id: string
          utc_offset: number
        }
        Insert: {
          average_speed: number
          created_at?: string | null
          distance: number
          elapsed_time: unknown
          id?: string
          moving_time: unknown
          name: string
          sport_type: string
          start_date: string
          start_date_local: string
          timezone: string
          total_elevation_gain: number
          type: string
          updated_at?: string | null
          user_id: string
          utc_offset: number
        }
        Update: {
          average_speed?: number
          created_at?: string | null
          distance?: number
          elapsed_time?: unknown
          id?: string
          moving_time?: unknown
          name?: string
          sport_type?: string
          start_date?: string
          start_date_local?: string
          timezone?: string
          total_elevation_gain?: number
          type?: string
          updated_at?: string | null
          user_id?: string
          utc_offset?: number
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          response_time_ms: number
          status: Database["public"]["Enums"]["suggestion_status"]
          suggestion_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms: number
          status: Database["public"]["Enums"]["suggestion_status"]
          suggestion_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms?: number
          status?: Database["public"]["Enums"]["suggestion_status"]
          suggestion_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goal_history: {
        Row: {
          changed_at: string | null
          goal_id: string
          id: string
          previous_metric_type: Database["public"]["Enums"]["goal_metric_type"]
          previous_target_value: number
        }
        Insert: {
          changed_at?: string | null
          goal_id: string
          id?: string
          previous_metric_type: Database["public"]["Enums"]["goal_metric_type"]
          previous_target_value: number
        }
        Update: {
          changed_at?: string | null
          goal_id?: string
          id?: string
          previous_metric_type?: Database["public"]["Enums"]["goal_metric_type"]
          previous_target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          id: string
          metric_type: Database["public"]["Enums"]["goal_metric_type"]
          scope_type: Database["public"]["Enums"]["goal_scope_type"]
          sport_id: string | null
          target_value: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: Database["public"]["Enums"]["goal_metric_type"]
          scope_type: Database["public"]["Enums"]["goal_scope_type"]
          sport_id?: string | null
          target_value: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: Database["public"]["Enums"]["goal_metric_type"]
          scope_type?: Database["public"]["Enums"]["goal_scope_type"]
          sport_id?: string | null
          target_value?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_metric_type: "distance" | "time" | "elevation_gain"
      goal_scope_type: "global" | "per_sport"
      suggestion_status: "pending" | "accepted" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      goal_metric_type: ["distance", "time", "elevation_gain"],
      goal_scope_type: ["global", "per_sport"],
      suggestion_status: ["pending", "accepted", "rejected"],
    },
  },
} as const

