import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 類型定義
export interface Food {
  id: string
  payload: {
    foodname: string
    imgurl?: string
    price: 'low' | 'medium' | 'high'
    taste: 1 | 2 | 3
  }
  tag_ids: string[]
  created_at: string
}

export interface Tag {
  id: string
  name: string
  food_ids: string[]
  created_at: string
}

// 資料轉換函數
export const formatPrice = (price: string): string => {
  switch (price) {
    case 'low': return '$'
    case 'medium': return '$$'
    case 'high': return '$$$'
    default: return '$'
  }
}

export const formatTaste = (taste: number): string => {
  switch (taste) {
    case 1: return '🩷'
    case 2: return '🩷🩷'
    case 3: return '🩷🩷🩷'
    default: return '🩷'
  }
}

export const parsePrice = (priceDisplay: string): 'low' | 'medium' | 'high' => {
  switch (priceDisplay) {
    case '$': return 'low'
    case '$$': return 'medium'
    case '$$$': return 'high'
    default: return 'low'
  }
}

export const parseTaste = (tasteDisplay: string): 1 | 2 | 3 => {
  switch (tasteDisplay) {
    case '🩷': return 1
    case '🩷🩷': return 2
    case '🩷🩷🩷': return 3
    default: return 1
  }
}