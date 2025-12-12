// auth-guard.js – forces login on EVERY page
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl =  ''        // ← from Supabase → Settings → API
const supabaseAnonKey = ''                              // ← the long "anon public" key

const supabase = createClient(supabaseUrl, supabaseAnonKey)

;(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const currentPath = window.location.pathname

  // Allow only the login page itself
  if (!session && currentPath !== '/login.html') {
    window.location.replace('/login.html')
  }
})()