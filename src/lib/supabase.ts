import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Bet = {
  id: string
  user_id: string
  match: string
  market: string
  odds: number
  confidence: number
  amount: number
  result: 'pending' | 'win' | 'loss'
  closing_odds: number | null
  created_at: string
  settled_at: string | null
}

export type BankrollSettings = {
  user_id: string
  current_balance: number
  currency: string
  max_bet_amount: number
  max_bets_per_day: number
  bookmaker: string
}

export type BankrollTransaction = {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'bet' | 'return'
  amount: number
  match: string | null
  market: string | null
  created_at: string
}
