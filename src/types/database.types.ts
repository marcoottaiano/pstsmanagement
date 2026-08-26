export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      group_nodes: {
        Row: {
          created_at: string;
          id: string;
          is_archived: boolean;
          name: string;
          node_type: string;
          parent_id: string | null;
          sector_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name: string;
          node_type: string;
          parent_id?: string | null;
          sector_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name?: string;
          node_type?: string;
          parent_id?: string | null;
          sector_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_nodes_parent_fkey";
            columns: ["sector_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "group_nodes";
            referencedColumns: ["sector_id", "id"];
          },
          {
            foreignKeyName: "group_nodes_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      objectives: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          group_id: string;
          id: string;
          period_end: string | null;
          period_start: string | null;
          sector_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          group_id: string;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          sector_id: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          group_id?: string;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          sector_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "objectives_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "objectives_group_fkey";
            columns: ["sector_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "group_nodes";
            referencedColumns: ["sector_id", "id"];
          },
          {
            foreignKeyName: "objectives_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminder_assignees: {
        Row: {
          reminder_id: string;
          user_id: string;
        };
        Insert: {
          reminder_id: string;
          user_id: string;
        };
        Update: {
          reminder_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_assignees_reminder_id_fkey";
            columns: ["reminder_id"];
            isOneToOne: false;
            referencedRelation: "reminders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminder_assignees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          due_all_day: boolean;
          due_at: string | null;
          group_id: string | null;
          id: string;
          priority: string;
          sector_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_all_day?: boolean;
          due_at?: string | null;
          group_id?: string | null;
          id?: string;
          priority?: string;
          sector_id: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_all_day?: boolean;
          due_at?: string | null;
          group_id?: string | null;
          id?: string;
          priority?: string;
          sector_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_group_fkey";
            columns: ["sector_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "group_nodes";
            referencedColumns: ["sector_id", "id"];
          },
          {
            foreignKeyName: "reminders_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_work: {
        Row: {
          all_day: boolean;
          created_at: string;
          created_by: string;
          description: string | null;
          end_at: string | null;
          group_id: string;
          id: string;
          sector_id: string;
          start_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          all_day?: boolean;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          end_at?: string | null;
          group_id: string;
          id?: string;
          sector_id: string;
          start_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          all_day?: boolean;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          end_at?: string | null;
          group_id?: string;
          id?: string;
          sector_id?: string;
          start_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_work_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_work_group_fkey";
            columns: ["sector_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "group_nodes";
            referencedColumns: ["sector_id", "id"];
          },
          {
            foreignKeyName: "scheduled_work_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      sectors: {
        Row: {
          code: string;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      user_sectors: {
        Row: {
          sector_id: string;
          user_id: string;
        };
        Insert: {
          sector_id: string;
          user_id: string;
        };
        Update: {
          sector_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_sectors_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_sectors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_reminder_with_assignees: {
        Args: {
          p_assignee_ids: string[];
          p_description: string | null;
          p_due_all_day: boolean;
          p_due_at: string | null;
          p_group_id: string | null;
          p_priority: string;
          p_sector_id: string;
          p_status: string;
          p_title: string;
        };
        Returns: string;
      };
      reorder_group_node: {
        Args: { move_direction: string; selected_node_id: string };
        Returns: undefined;
      };
      resolve_group_scope: {
        Args: { selected_node_id: string };
        Returns: {
          group_id: string;
        }[];
      };
      set_group_subtree_archive_state: {
        Args: { archived: boolean; selected_node_id: string };
        Returns: undefined;
      };
      update_reminder_with_assignees: {
        Args: {
          p_assignee_ids: string[];
          p_description: string | null;
          p_due_all_day: boolean;
          p_due_at: string | null;
          p_group_id: string | null;
          p_priority: string;
          p_reminder_id: string;
          p_sector_id: string;
          p_status: string;
          p_title: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
