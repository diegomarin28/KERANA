import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cfmcvslstfryhapvsztu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWN2c2xzdGZyeWhhcHZzenR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTU1NjksImV4cCI6MjA3NDI5MTU2OX0.zdxGByp22wcVxozLPKli32kMRfPekshQskvn8MDqMbU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)