export type TxnType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: number
  user_id: string | null
  name: string
  icon: string
  color: string
  type: TxnType
  is_default: boolean
}

export interface Transaction {
  id: number
  category_id: number
  amount: number
  type: TxnType
  description: string | null
  transaction_date: string
  created_at: string
  category?: Category
}

export interface Budget {
  id: number
  category_id: number
  amount_limit: number
  budget_month: number
  budget_year: number
  category?: Category
}

export interface Profile {
  id: string
  full_name: string
  username: string | null
  currency: string
}

export interface TxnInput {
  type: TxnType
  category_id: number
  amount: number
  transaction_date: string
  description: string | null
}
