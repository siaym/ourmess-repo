export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      messes: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          invite_code: string | null
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          invite_code?: string | null
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          invite_code?: string | null
          created_at?: string
          is_deleted?: boolean
        }
      }
      mess_members: {
        Row: {
          id: string
          mess_id: string
          user_id: string
          role: 'owner' | 'manager' | 'member'
          joined_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          mess_id: string
          user_id: string
          role: 'owner' | 'manager' | 'member'
          joined_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          mess_id?: string
          user_id?: string
          role?: 'owner' | 'manager' | 'member'
          joined_at?: string
          is_deleted?: boolean
        }
      }
      meals: {
        Row: {
          id: string
          mess_id: string
          member_id: string
          date: string
          breakfast: number
          lunch: number
          dinner: number
          total_meal: number
          created_by: string | null
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          mess_id: string
          member_id: string
          date: string
          breakfast?: number
          lunch?: number
          dinner?: number
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          mess_id?: string
          member_id?: string
          date?: string
          breakfast?: number
          lunch?: number
          dinner?: number
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
      }
      expenses: {
        Row: {
          id: string
          mess_id: string
          title: string
          category: 'Market' | 'Utility' | 'Maintenance' | 'Internet' | 'Other'
          amount: number
          receipt_url: string | null
          expense_date: string
          created_by: string | null
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          mess_id: string
          title: string
          category: 'Market' | 'Utility' | 'Maintenance' | 'Internet' | 'Other'
          amount: number
          receipt_url?: string | null
          expense_date: string
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          mess_id?: string
          title?: string
          category?: 'Market' | 'Utility' | 'Maintenance' | 'Internet' | 'Other'
          amount?: number
          receipt_url?: string | null
          expense_date?: string
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
      }
      deposits: {
        Row: {
          id: string
          mess_id: string
          member_id: string
          amount: number
          payment_method: 'Cash' | 'bKash' | 'Nagad' | 'Bank'
          deposit_date: string
          created_by: string | null
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          mess_id: string
          member_id: string
          amount: number
          payment_method: 'Cash' | 'bKash' | 'Nagad' | 'Bank'
          deposit_date: string
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          mess_id?: string
          member_id?: string
          amount?: number
          payment_method?: 'Cash' | 'bKash' | 'Nagad' | 'Bank'
          deposit_date?: string
          created_by?: string | null
          created_at?: string
          is_deleted?: boolean
        }
      }
    }
    Views: {
      member_balances: {
        Row: {
          mess_id: string
          member_id: string
          total_deposits: number
          total_meals: number
          current_meal_rate: number
          balance: number
        }
      }
    }
  }
}
