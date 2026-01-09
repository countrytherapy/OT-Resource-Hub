// currency.js - Multi-currency with real conversions + fixes for async header
const BASE_CURRENCY = 'AED';
const BASE_PRICE = 2.50; // All your products are this price

const COUNTRY_TO_CURRENCY = {
  'AU': 'AUD',
  'US': 'USD',
  'GB': 'GBP',
  'CA': 'CAD',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'AE': 'AED',
  'IN': 'INR',
  'SG': 'SGD',
  'NZ': 'NZD',
  'JP': 'JPY',
  'CH': 'CHF'
};

const SUPPORTED_CURRENCIES = ['AED', 'AUD', 'USD', 'GBP', 'EUR', 'CAD', 'SGD', 'INR', 'NZD', 'JPY', 'CHF'];

let rates = {};

async function fetchRates() {
  try {
    // Using fawazahmed0's free CDN API - no key, no limits, reliable
    const response = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/aed.json');
    const data = await response.json();
    rates = data.aed; // Rates relative to AED
  } catch (e) {
    console.warn('Rates fetch failed, using 1:1 fallback');
    rates = Object.fromEntries(SUPPORTED_CURRENCIES.map(c => [c.toLowerCase(), 1]));
    rates[BASE_CURRENCY.toLowerCase()] = 1;
  }
}

function getConvertedPrice(currency) {
  const rate = rates[currency.toLowerCase()] || 1;
  return (BASE_PRICE * rate).toFixed(2);
}

function applyCurrency(currency) {
  const converted = getConvertedPrice(currency);

  // Update visible prices: change the number + symbol
  document.querySelectorAll('.price').forEach(priceEl => {
    const symbolEl = priceEl.querySelector('.currency-symbol');
    if (symbolEl) {
      // Find the price number (assuming it's the text before the span)
      const textNode = Array.from(priceEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.textContent = converted + ' ';
      symbolEl.textContent = currency;
    }
  });

  // Update projected cost on product pages
  const projected = document.getElementById('projected');
  if (projected && document.getElementById('qty-input')) {
    const qty = parseInt(document.getElementById('qty-input').value || 1);
    projected.innerHTML = (converted * qty).toFixed(2) + ' <span class="currency-symbol">' + currency + '</span>';
  }

  // Update dropdown selection
  const select = document.getElementById('currency-select');
  if (select) select.value = currency;

  // Update Snipcart
  if (window.Snipcart) {
    Snipcart.api.session.setCurrency(currency);
    document.querySelectorAll('.snipcart-add-item').forEach(btn => {
      btn.setAttribute('data-item-price', converted);
    });
  }
}

function populateDropdown() {
  const select = document.getElementById('currency-select');
  if (!select || select.children.length > 0) return;

  SUPPORTED_CURRENCIES.forEach(cur => {
    const opt = document.createElement('option');
    opt.value = cur;
    opt.textContent = cur;
    select.appendChild(opt);
  });
}

async function initCurrency() {
  await fetchRates();

  let currency = localStorage.getItem('preferredCurrency');

  if (!currency) {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      currency = COUNTRY_TO_CURRENCY[data.country_code] || 'AED';
    } catch (e) {
      currency = 'AED';
    }
    localStorage.setItem('preferredCurrency', currency);
  }

  applyCurrency(currency);
}

// Wait for async header to load, then initialize
document.addEventListener('DOMContentLoaded', () => {
  const checkInterval = setInterval(async () => {
    if (document.querySelector('.currency-switcher')) {
      clearInterval(checkInterval);
      populateDropdown();
      await initCurrency();

      // Manual change handler
      const select = document.getElementById('currency-select');
      if (select) {
        select.addEventListener('change', async (e) => {
          const newCurrency = e.target.value;
          localStorage.setItem('preferredCurrency', newCurrency);
          await fetchRates(); // Refresh rates
          applyCurrency(newCurrency);
        });
      }

      // Qty change on product pages
      const qtyInput = document.getElementById('qty-input');
      if (qtyInput) {
        qtyInput.addEventListener('input', () => applyCurrency(localStorage.getItem('preferredCurrency') || 'AED'));
      }
    }
  }, 100);
});