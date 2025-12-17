// auth-guard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ymtamonkaajuxxwcslbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGFtb25rYWFqdXh4d2NzbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjg1ODUsImV4cCI6MjA4MDkwNDU4NX0.dSZ0vvTE0Y2MbUHPnrsviMYGi_us7jf2Kr2R6Os195E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if user is logged in
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not logged in → redirect to login
    window.location.href = '/user_templates/login.html';  // Adjust path if needed
  }
  // If logged in, do nothing (page loads normally)
}

// Run on page load
checkAuth();

// Optional: Listen for auth changes (e.g., if user logs out elsewhere)
supabase.auth.onAuthStateChange((event, session) => {
  if (!session && event !== 'SIGNED_OUT') {
    window.location.href = '/user_templates/login.html';
  }
});