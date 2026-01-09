// payment-handler.js
// This handles the payment completion and marks user as paid in localStorage

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ymtamonkaajuxxwcslbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGFtb25rYWFqdXh4d2NzbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjg1ODUsImV4cCI6MjA4MDkwNDU4NX0.dSZ0vvTE0Y2MbUHPnrsviMYGi_us7jf2Kr2R6Os195E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Wait for Snipcart to be ready and listen for order completion
async function setupPaymentListener() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('No session found - user may not be logged in');
    return;
  }

  // Listen for Snipcart events
  if (window.Snipcart) {
    window.Snipcart.events.on('order:completed', async function(order) {
      console.log('Order completed:', order);
      
      const userId = session.user.id;
      const subscriptionEnd = new Date();
      
      // Determine subscription length based on order items
      const isAnnual = order.items.some(item => item.id === 'annual-premium');
      
      if (isAnnual) {
        // Annual subscription: add 365 days
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      } else {
        // Monthly subscription: add 30 days
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
      }
      
      // Store payment status in localStorage
      const paymentData = {
        orderId: order.invoiceNumber,
        planType: isAnnual ? 'annual' : 'monthly',
        purchaseDate: new Date().toISOString(),
        expiryDate: subscriptionEnd.toISOString(),
        active: true
      };
      
      localStorage.setItem(`paid_${userId}`, JSON.stringify(paymentData));
      localStorage.setItem('lastPayment', JSON.stringify(paymentData));
      
      // Show success message
      alert('🎉 Payment successful! Your subscription is now active.');
      
      // Redirect to thank you page after short delay
      setTimeout(() => {
        window.location.href = '/thank-you-payment.html';
      }, 1500);
    });
    
    window.Snipcart.events.on('order:failed', function(order) {
      console.error('Payment failed:', order);
      alert('❌ Payment failed. Please try again or contact support.');
    });
  }
}

// Call setup when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPaymentListener);
} else {
  setupPaymentListener();
}

// Check payment expiry and return payment status
async function checkPaymentExpiry() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const userId = session.user.id;
    const paymentData = localStorage.getItem(`paid_${userId}`);
    
    if (paymentData) {
      const payment = JSON.parse(paymentData);
      const expiryDate = new Date(payment.expiryDate);
      const now = new Date();
      
      if (now > expiryDate) {
        // Subscription expired
        localStorage.removeItem(`paid_${userId}`);
        return false;
      }
      return true;
    }
  }
  return false;
}

// Export for use in other scripts
window.PaymentHandler = {
  checkPaymentExpiry,
  isUserPaid: async function(userId) {
    const paymentData = localStorage.getItem(`paid_${userId}`);
    if (!paymentData) return false;
    
    const payment = JSON.parse(paymentData);
    const expiryDate = new Date(payment.expiryDate);
    const now = new Date();
    
    return now <= expiryDate && payment.active;
  },
  getPaymentInfo: function(userId) {
    const paymentData = localStorage.getItem(`paid_${userId}`);
    return paymentData ? JSON.parse(paymentData) : null;
  }
};
