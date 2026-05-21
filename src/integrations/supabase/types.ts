export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          followee_wallet: string
          follower_wallet: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_wallet: string
          follower_wallet: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_wallet?: string
          follower_wallet?: string
          id?: string
        }
        Relationships: []
      }
      meme_box_openings: {
        Row: {
          box_type: string
          created_at: string
          id: string
          price_cusd: number
          reward_emoji: string
          reward_label: string
          reward_type: string
          reward_value: string
          tx_hash: string
          wallet: string
        }
        Insert: {
          box_type: string
          created_at?: string
          id?: string
          price_cusd: number
          reward_emoji?: string
          reward_label: string
          reward_type: string
          reward_value: string
          tx_hash: string
          wallet: string
        }
        Update: {
          box_type?: string
          created_at?: string
          id?: string
          price_cusd?: number
          reward_emoji?: string
          reward_label?: string
          reward_type?: string
          reward_value?: string
          tx_hash?: string
          wallet?: string
        }
        Relationships: []
      }
      meme_likes: {
        Row: {
          created_at: string
          id: string
          meme_id: string
          wallet: string
        }
        Insert: {
          created_at?: string
          id?: string
          meme_id: string
          wallet: string
        }
        Update: {
          created_at?: string
          id?: string
          meme_id?: string
          wallet?: string
        }
        Relationships: []
      }
      meme_saves: {
        Row: {
          created_at: string
          id: string
          meme_id: string
          wallet: string
        }
        Insert: {
          created_at?: string
          id?: string
          meme_id: string
          wallet: string
        }
        Update: {
          created_at?: string
          id?: string
          meme_id?: string
          wallet?: string
        }
        Relationships: []
      }
      meme_tips: {
        Row: {
          amount_cusd: number
          created_at: string
          from_wallet: string
          id: string
          meme_id: string
          to_wallet: string
          tx_hash: string
        }
        Insert: {
          amount_cusd: number
          created_at?: string
          from_wallet: string
          id?: string
          meme_id: string
          to_wallet: string
          tx_hash: string
        }
        Update: {
          amount_cusd?: number
          created_at?: string
          from_wallet?: string
          id?: string
          meme_id?: string
          to_wallet?: string
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "meme_tips_meme_id_fkey"
            columns: ["meme_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
      memes: {
        Row: {
          ai_generated: boolean
          allow_remixing: boolean
          caption: string
          created_at: string
          creator_wallet: string
          id: string
          image_url: string
          likes_count: number
          manual_upload: boolean
          parent_id: string | null
          remix_count: number
          tags: string[]
          tipping_enabled: boolean
          tips_total: number
        }
        Insert: {
          ai_generated?: boolean
          allow_remixing?: boolean
          caption?: string
          created_at?: string
          creator_wallet: string
          id?: string
          image_url: string
          likes_count?: number
          manual_upload?: boolean
          parent_id?: string | null
          remix_count?: number
          tags?: string[]
          tipping_enabled?: boolean
          tips_total?: number
        }
        Update: {
          ai_generated?: boolean
          allow_remixing?: boolean
          caption?: string
          created_at?: string
          creator_wallet?: string
          id?: string
          image_url?: string
          likes_count?: number
          manual_upload?: boolean
          parent_id?: string | null
          remix_count?: number
          tags?: string[]
          tipping_enabled?: boolean
          tips_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "memes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          meta: Json
          read: boolean
          wallet: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          read?: boolean
          wallet: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          read?: boolean
          wallet?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_uses_remaining: number
          avatar_url: string | null
          balance_cusd: number
          bio: string | null
          created_at: string
          purple_tick: boolean
          purple_tick_expires_at: string | null
          tx_hash: string | null
          updated_at: string
          username: string
          verified: boolean
          wallet_address: string
        }
        Insert: {
          ai_uses_remaining?: number
          avatar_url?: string | null
          balance_cusd?: number
          bio?: string | null
          created_at?: string
          purple_tick?: boolean
          purple_tick_expires_at?: string | null
          tx_hash?: string | null
          updated_at?: string
          username: string
          verified?: boolean
          wallet_address: string
        }
        Update: {
          ai_uses_remaining?: number
          avatar_url?: string | null
          balance_cusd?: number
          bio?: string | null
          created_at?: string
          purple_tick?: boolean
          purple_tick_expires_at?: string | null
          tx_hash?: string | null
          updated_at?: string
          username?: string
          verified?: boolean
          wallet_address?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cusd: number
          created_at: string
          expires_at: string
          id: string
          plan: string
          starts_at: string
          tx_hash: string
          wallet_address: string
        }
        Insert: {
          amount_cusd: number
          created_at?: string
          expires_at: string
          id?: string
          plan: string
          starts_at?: string
          tx_hash: string
          wallet_address: string
        }
        Update: {
          amount_cusd?: number
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          starts_at?: string
          tx_hash?: string
          wallet_address?: string
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
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
