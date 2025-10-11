import { createClient } from '@supabase/supabase-js'

// ✅ Supabase Configuration
const supabaseUrl = 'https://zybagsuniyidctaxmqbt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmFnc3VuaXlpZGN0YXhtcWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjEyNDIsImV4cCI6MjA3NTU5NzI0Mn0.hnpCMV21Bmyq4jXRdSDCQybcoFsrJhe3auCByKF0_iE'

// ✅ Validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing')
}

// ✅ Create Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
