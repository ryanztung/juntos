import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://nigvyotnrlgbqeeyueql.supabase.co'
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZ3Z5b3RucmxnYnFlZXl1ZXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Mjc1MDUsImV4cCI6MjA5MTEwMzUwNX0.d4BeEIwilSpG5etMUQyr-PnusnI5bCm6tcPwVwaagj4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
