const assert = require('assert');
const { convertCurrency, indiaTax, calcOffer, changePct } = require('../lib/comp');

const rates = { USD: 1, INR: 83, THB: 35.5, EUR: 0.92, GBP: 0.79, SGD: 1.34, CAD: 1.35, AUD: 1.52, AED: 3.67 };

function approxEqual(a, b, tol = 1e-6) {
  assert.ok(Math.abs(a - b) <= tol, `Expected ${a} ≈ ${b}`);
}

// Currency conversions
approxEqual(convertCurrency(100, 'USD', 'USD', rates), 100);
approxEqual(convertCurrency(8300, 'INR', 'USD', rates), 100);
approxEqual(convertCurrency(100, 'USD', 'EUR', rates), 92);
approxEqual(convertCurrency(100, 'USD', 'GBP', rates), 79);
approxEqual(convertCurrency(3550, 'THB', 'USD', rates), 100);
approxEqual(convertCurrency(3550, 'THB', 'INR', rates), 8300);

// Offer math
const offer = calcOffer({ baseMonthly: 280000, bonusPct: 20, equityAnnual: 850000, signing: 700000 });
assert.strictEqual(offer.baseAnnual, 3360000);
assert.strictEqual(offer.bonusAnnual, 672000);
assert.strictEqual(offer.offerTotal, 5582000);

// Change % sanity (INR base)
const currentINR = 8350000;
const offerINR = convertCurrency(offer.offerTotal, 'THB', 'INR', rates);
const pct = changePct(offerINR, currentINR);
assert.ok(pct > 0, 'Offer should be higher than current in this scenario');

// India tax slabs sanity
const taxLow = indiaTax(600000); // below 7L rebate
assert.strictEqual(taxLow, 0);
const taxHigh = indiaTax(2000000);
assert.ok(taxHigh > 0, 'Tax should be > 0 for high income');

console.log('✅ All tests passed');
