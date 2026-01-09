// auth-guard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ymtamonkaajuxxwcslbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGFtb25rYWFqdXh4d2NzbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjg1ODUsImV4cCI6MjA4MDkwNDU4NX0.dSZ0vvTE0Y2MbUHPnrsviMYGi_us7jf2Kr2R6Os195E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if user is logged in AND has paid for premium access
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not logged in → redirect to login
    window.location.href = '/user_templates/login.html';
    return;
  }
  
  // Check if user has paid (stored in localStorage)
  const userPaid = localStorage.getItem(`paid_${session.user.id}`);
  
  if (!userPaid) {
    // Logged in but hasn't paid → redirect to payment gateway
    window.location.href = '/paymentGateway.html';
    return;
  }
  
  // Logged in and paid → allow access (page loads normally)
}

// Run on page load
checkAuth();

// Optional: Listen for auth changes (e.g., if user logs out elsewhere)
supabase.auth.onAuthStateChange((event, session) => {
  if (!session && event !== 'SIGNED_OUT') {
    window.location.href = '/user_templates/login.html';
    return;
  }
  
  // If logged in, verify payment status
  if (session) {
    const userPaid = localStorage.getItem(`paid_${session.user.id}`);
    if (!userPaid && !window.location.href.includes('paymentGateway.html')) {
      window.location.href = '/paymentGateway.html';
    }
  }
});