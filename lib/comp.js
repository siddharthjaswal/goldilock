function convertCurrency(amount, from, to, rates) {
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  const usd = amount / fromRate;
  return usd * toRate;
}

function indiaTax(income) {
  const taxable = Math.max(0, income - 75000);
  let tax = 0;
  const slabs = [
    [300000, 0],
    [400000, 0.05],
    [300000, 0.1],
    [200000, 0.15],
    [300000, 0.2],
    [Infinity, 0.3],
  ];
  let remaining = taxable;
  for (const [size, rate] of slabs) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, size);
    tax += chunk * rate;
    remaining -= chunk;
  }
  if (taxable <= 700000) tax = 0;
  tax = tax * 1.04;
  return tax;
}

function calcOffer({ baseMonthly, bonusPct, equityAnnual, signing }) {
  const baseAnnual = baseMonthly * 12;
  const bonusAnnual = baseAnnual * (bonusPct / 100);
  const offerTotal = baseAnnual + bonusAnnual + equityAnnual + signing;
  const recurring = baseAnnual + bonusAnnual + equityAnnual;
  return { baseAnnual, bonusAnnual, offerTotal, recurring };
}

function changePct(offer, current) {
  return ((offer - current) / Math.max(current, 1)) * 100;
}

module.exports = { convertCurrency, indiaTax, calcOffer, changePct };
