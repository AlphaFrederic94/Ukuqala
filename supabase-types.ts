export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          calories_burned: number | null
          created_at: string | null
          date: string | null
          duration: number
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          calories_burned?: number | null
          created_at?: string | null
          date?: string | null
          duration: number
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number | null
          created_at?: string | null
          date?: string | null
          duration?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_pins: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          last_attempt: string | null
          last_used: string | null
          pin_hash: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          last_used?: string | null
          pin_hash: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          last_used?: string | null
          pin_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string | null
          doctor_id: string
          email_sent: boolean | null
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          doctor_id: string
          email_sent?: boolean | null
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          doctor_id?: string
          email_sent?: boolean | null
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_health_record_access: {
        Row: {
          granted_at: string | null
          id: string
          provider_user_id: string
          record_id: string
          revoked_at: string | null
        }
        Insert: {
          granted_at?: string | null
          id?: string
          provider_user_id: string
          record_id: string
          revoked_at?: string | null
        }
        Update: {
          granted_at?: string | null
          id?: string
          provider_user_id?: string
          record_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_health_record_access_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "blockchain_health_records"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_health_record_verification: {
        Row: {
          id: string
          is_verified: boolean
          record_id: string
          verification_date: string | null
          verification_details: Json | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          is_verified: boolean
          record_id: string
          verification_date?: string | null
          verification_details?: Json | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          is_verified?: boolean
          record_id?: string
          verification_date?: string | null
          verification_details?: Json | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_health_record_verification_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "blockchain_health_records"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_health_records: {
        Row: {
          blockchain_id: string
          created_at: string | null
          encrypted_data: string
          file_url: string | null
          id: string
          record_hash: string
          record_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blockchain_id: string
          created_at?: string | null
          encrypted_data: string
          file_url?: string | null
          id?: string
          record_hash: string
          record_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blockchain_id?: string
          created_at?: string | null
          encrypted_data?: string
          file_url?: string | null
          id?: string
          record_hash?: string
          record_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          is_sticker: boolean | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          is_sticker?: boolean | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_sticker?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      disease_outbreaks: {
        Row: {
          cases: number
          created_at: string | null
          description: string | null
          disease: string
          id: string
          latitude: number
          longitude: number
          precautions: Json | null
          severity: string
          start_date: string
          status: string
          symptoms: Json | null
          updated_at: string | null
        }
        Insert: {
          cases: number
          created_at?: string | null
          description?: string | null
          disease: string
          id?: string
          latitude: number
          longitude: number
          precautions?: Json | null
          severity: string
          start_date: string
          status: string
          symptoms?: Json | null
          updated_at?: string | null
        }
        Update: {
          cases?: number
          created_at?: string | null
          description?: string | null
          disease?: string
          id?: string
          latitude?: number
          longitude?: number
          precautions?: Json | null
          severity?: string
          start_date?: string
          status?: string
          symptoms?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          availability: Json | null
          created_at: string | null
          id: string
          image: string | null
          location: string | null
          name: string
          rating: number | null
          specialty: string
        }
        Insert: {
          availability?: Json | null
          created_at?: string | null
          id?: string
          image?: string | null
          location?: string | null
          name: string
          rating?: number | null
          specialty: string
        }
        Update: {
          availability?: Json | null
          created_at?: string | null
          id?: string
          image?: string | null
          location?: string | null
          name?: string
          rating?: number | null
          specialty?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          appointment_date: string
          appointment_id: string | null
          created_at: string | null
          doctor_id: string
          email_type: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_id?: string | null
          created_at?: string | null
          doctor_id: string
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_user_data: {
        Row: {
          created_at: string | null
          data_type: string
          encrypted_data: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_type: string
          encrypted_data: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_type?: string
          encrypted_data?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          duration: unknown
          exercise_type: string
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          duration: unknown
          exercise_type: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          duration?: unknown
          exercise_type?: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sessions: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          date: string | null
          duration: number
          id: string
          notes: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          date?: string | null
          duration: number
          id?: string
          notes?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          date?: string | null
          duration?: number
          id?: string
          notes?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          fat: number
          id: string
          is_custom: boolean | null
          name: string
          protein: number
          user_id: string | null
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          fat: number
          id?: string
          is_custom?: boolean | null
          name: string
          protein: number
          user_id?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          fat?: number
          id?: string
          is_custom?: boolean | null
          name?: string
          protein?: number
          user_id?: string | null
        }
        Relationships: []
      }
      game_results: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          game_type: string
          id: string
          moves: number | null
          opponent: string
          result: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          game_type: string
          id?: string
          moves?: number | null
          opponent: string
          result: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          game_type?: string
          id?: string
          moves?: number | null
          opponent?: string
          result?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          animations_enabled: boolean | null
          created_at: string | null
          difficulty: string
          game_type: string
          id: string
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean | null
          created_at?: string | null
          difficulty: string
          game_type: string
          id?: string
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          animations_enabled?: boolean | null
          created_at?: string | null
          difficulty?: string
          game_type?: string
          id?: string
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_events: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          latitude: number
          location: string | null
          longitude: number
          name: string
          organizer: string | null
          time: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          latitude: number
          location?: string | null
          longitude: number
          name: string
          organizer?: string | null
          time?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          latitude?: number
          location?: string | null
          longitude?: number
          name?: string
          organizer?: string | null
          time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      health_facilities: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          hours: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          services: Json | null
          updated_at: string | null
          wait_time: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          hours?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          services?: Json | null
          updated_at?: string | null
          wait_time?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          hours?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          services?: Json | null
          updated_at?: string | null
          wait_time?: string | null
        }
        Relationships: []
      }
      health_history: {
        Row: {
          id: string
          metric_name: string
          metric_value: string
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: string
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: string
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          alt: number | null
          blood_pressure: string | null
          blood_sugar: number | null
          bmi: number | null
          cholesterol: number | null
          created_at: string | null
          creatinine: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alt?: number | null
          blood_pressure?: string | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol?: number | null
          created_at?: string | null
          creatinine?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alt?: number | null
          blood_pressure?: string | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol?: number | null
          created_at?: string | null
          creatinine?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_metrics_regions: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          metric_name: string
          metric_value: number
          radius: number | null
          region_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          metric_name: string
          metric_value: number
          radius?: number | null
          region_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          metric_name?: string
          metric_value?: number
          radius?: number | null
          region_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      health_programs: {
        Row: {
          body_type: string | null
          created_at: string | null
          end_date: string | null
          id: string
          metrics: Json | null
          progress: number | null
          start_date: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          progress?: number | null
          start_date: string
          status: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          progress?: number | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_reports: {
        Row: {
          created_at: string | null
          description: string | null
          disease: string | null
          id: string
          is_anonymous: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          report_type: string
          severity: string | null
          symptom: string | null
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          disease?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          report_type: string
          severity?: string | null
          symptom?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          disease?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          report_type?: string
          severity?: string | null
          symptom?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      health_simulations: {
        Row: {
          created_at: string | null
          id: string
          parameters: Json
          results: Json
          simulation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          parameters: Json
          results: Json
          simulation_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          parameters?: Json
          results?: Json
          simulation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number
          created_at: string | null
          food_items: Json
          id: string
          logged_at: string
          meal_type: string
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id: string | null
        }
        Insert: {
          calories: number
          created_at?: string | null
          food_items: Json
          id?: string
          logged_at?: string
          meal_type: string
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id?: string | null
        }
        Update: {
          calories?: number
          created_at?: string | null
          food_items?: Json
          id?: string
          logged_at?: string
          meal_type?: string
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          blood_group: string | null
          bmi: number | null
          created_at: string | null
          current_weight: number | null
          date_of_birth: string | null
          gender: string | null
          health_conditions: string[] | null
          height: number | null
          id: string
          last_checkup_date: string | null
          medications: string[] | null
          target_weight: number | null
          updated_at: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string | null
          current_weight?: number | null
          date_of_birth?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          last_checkup_date?: string | null
          medications?: string[] | null
          target_weight?: number | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string | null
          current_weight?: number | null
          date_of_birth?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          last_checkup_date?: string | null
          medications?: string[] | null
          target_weight?: number | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          created_at: string | null
          daily_calories: number
          daily_carbs: number
          daily_fat: number
          daily_protein: number
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_calories: number
          daily_carbs: number
          daily_fat: number
          daily_protein: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          created_at: string | null
          food_items: Json
          id: string
          logged_at: string | null
          meal_type: string
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string | null
        }
        Insert: {
          calories: number
          created_at?: string | null
          food_items: Json
          id?: string
          logged_at?: string | null
          meal_type: string
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string | null
        }
        Update: {
          calories?: number
          created_at?: string | null
          food_items?: Json
          id?: string
          logged_at?: string | null
          meal_type?: string
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          active: boolean | null
          body_type: string
          calories: number
          created_at: string | null
          dietary_restrictions: string[] | null
          goal: string
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          body_type: string
          calories: number
          created_at?: string | null
          dietary_restrictions?: string[] | null
          goal: string
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          body_type?: string
          calories?: number
          created_at?: string | null
          dietary_restrictions?: string[] | null
          goal?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string | null
          id: string
          prediction_type: string
          result: string
          result_details: Json | null
          risk_level: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prediction_type: string
          result: string
          result_details?: Json | null
          risk_level?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prediction_type?: string
          result?: string
          result_details?: Json | null
          risk_level?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_progress: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metrics: Json
          notes: string | null
          program_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metrics: Json
          notes?: string | null
          program_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metrics?: Json
          notes?: string | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "health_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          quality: number | null
          sleep_time: string
          user_id: string | null
          wake_time: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          quality?: number | null
          sleep_time: string
          user_id?: string | null
          wake_time: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          quality?: number | null
          sleep_time?: string
          user_id?: string | null
          wake_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sleep_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_programs: {
        Row: {
          active: boolean | null
          alarm_enabled: boolean | null
          created_at: string | null
          duration: unknown
          id: string
          sleep_time: string
          user_id: string
          wake_time: string
        }
        Insert: {
          active?: boolean | null
          alarm_enabled?: boolean | null
          created_at?: string | null
          duration: unknown
          id?: string
          sleep_time: string
          user_id: string
          wake_time: string
        }
        Update: {
          active?: boolean | null
          alarm_enabled?: boolean | null
          created_at?: string | null
          duration?: unknown
          id?: string
          sleep_time?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      social_ads: {
        Row: {
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_anonymous: boolean | null
          is_compressed: boolean | null
          likes_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          is_compressed?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          is_compressed?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_encryption_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          age: number
          blood_group: string
          created_at: string | null
          current_weight: number
          height: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age: number
          blood_group: string
          created_at?: string | null
          current_weight: number
          height: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number
          blood_group?: string
          created_at?: string | null
          current_weight?: number
          height?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tutorials: {
        Row: {
          completed_tutorials: Json | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_tutorials?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_tutorials?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_reminders: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          reminder_intervals: number[]
          target_daily_ml: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reminder_intervals: number[]
          target_daily_ml?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reminder_intervals?: number[]
          target_daily_ml?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_measurements: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles_with_email: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_health_record_access: {
        Args: { record_id: string; user_id: string }
        Returns: boolean
      }
      get_latest_messages_received: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read: boolean
          created_at: string
          sender_name: string
          sender_avatar: string
        }[]
      }
      get_latest_messages_sent: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read: boolean
          created_at: string
          recipient_name: string
          recipient_avatar: string
        }[]
      }
      get_prediction_stats: {
        Args: { user_id: string }
        Returns: {
          total_count: number
          low_risk_count: number
          moderate_risk_count: number
          high_risk_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
