'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83,
  SGD: 1.34,
  CAD: 1.35,
  AUD: 1.52,
  THB: 35.5,
  AED: 3.67,
};

const taxRates: Record<string, number> = {
  IN: 0.22,
  US: 0.28,
  UK: 0.3,
  SG: 0.12,
  TH: 0.17,
  AE: 0.0,
  DE: 0.32,
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SGD: 'S$',
  CAD: 'C$',
  AUD: 'A$',
  THB: '฿',
  AED: 'د.إ',
};

export default function SimulatorClient() {
  const params = useSearchParams();
  const country = params.get('country') || 'IN';
  const baseCurrency = params.get('currency') || 'USD';
  const currentBase = Number(params.get('base') || 0);
  const currentBonus = Number(params.get('bonus') || 0);
  const currentEquity = Number(params.get('equity') || 0);

  const [rates, setRates] = useState<Record<string, number>>(fallbackRates);
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency);

  const [baseMonthly, setBaseMonthly] = useState(280000);
  const [bonusPct, setBonusPct] = useState(20);
  const [equityAnnual, setEquityAnnual] = useState(850000);
  const [signing, setSigning] = useState(700000);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates) setRates({ ...fallbackRates, ...data.rates });
      })
      .catch(() => null);
  }, []);

  const convert = (amount: number, from: string, to: string) => {
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    const usd = amount / fromRate;
    return usd * toRate;
  };

  const fmt = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || '';
    if (currency === 'INR') {
      if (amount >= 10000000) return `${symbol}${(amount / 10000000).toFixed(2)}Cr`;
      if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${symbol}${Math.round(amount / 1000)}k`;
    return `${symbol}${Math.round(amount)}`;
  };

  const currentTC = currentBase + currentBonus + currentEquity;
  const currentTax = currentTC * (taxRates[country] || 0.2);
  const currentTakeHome = currentTC - currentTax;

  const baseAnnual = baseMonthly * 12;
  const bonusAnnual = baseAnnual * (bonusPct / 100);
  const offerTC = baseAnnual + bonusAnnual + equityAnnual + signing;
  const recurring = baseAnnual + bonusAnnual + equityAnnual;
  const tax = recurring * (taxRates[country] || 0.2);
  const takeHome = recurring - tax + signing;

  const displayCurrent = useMemo(() => convert(currentTC, baseCurrency, displayCurrency), [currentTC, baseCurrency, displayCurrency, rates]);
  const displayOffer = useMemo(() => convert(offerTC, baseCurrency, displayCurrency), [offerTC, baseCurrency, displayCurrency, rates]);

  const verdict = () => {
    const pct = ((offerTC - currentTC) / Math.max(currentTC, 1)) * 100;
    if (pct < 5) return { emoji: '🚨', title: 'Lowball', desc: 'This doesn’t clear the bar. Push hard or walk.' };
    if (pct < 15) return { emoji: '😬', title: 'Meh', desc: 'Marginal improvement. Negotiate base or signing.' };
    if (pct < 30) return { emoji: '✅', title: 'Strong', desc: 'This is a meaningful step up.' };
    return { emoji: '💎', title: 'Goldmine', desc: 'Exceptional package. Lock it in.' };
  };

  const v = verdict();

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-extrabold text-[var(--accent)]">Goldilock Simulator</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Offer builder + live verdict</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-4 py-2 text-xs text-[var(--text)]"
            >
              {Object.keys(fallbackRates).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Link href="/" className="text-xs text-[var(--muted)] underline">Edit baseline</Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Current baseline</div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Base', val: currentBase },
                  { label: 'Bonus', val: currentBonus },
                  { label: 'Equity', val: currentEquity },
                  { label: 'Total', val: currentTC },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{item.label}</div>
                    <div className="mt-2 font-sans text-sm font-bold text-[var(--text)]">
                      {fmt(convert(item.val, baseCurrency, displayCurrency), displayCurrency)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4 flex justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Take‑home</div>
                  <div className="mt-1 font-sans text-sm font-bold text-[var(--green)]">{fmt(convert(currentTakeHome, baseCurrency, displayCurrency), displayCurrency)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Tax</div>
                  <div className="mt-1 text-xs text-[var(--red)]">{(taxRates[country] || 0.2) * 100}%</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Offer builder</div>

              {[
                {
                  label: 'Base salary (monthly)',
                  value: baseMonthly,
                  set: setBaseMonthly,
                  min: 150000,
                  max: 450000,
                  step: 5000,
                  suffix: '',
                },
                {
                  label: 'Bonus (% of base)',
                  value: bonusPct,
                  set: setBonusPct,
                  min: 0,
                  max: 35,
                  step: 1,
                  suffix: '%',
                },
                {
                  label: 'Equity / RSUs (annual)',
                  value: equityAnnual,
                  set: setEquityAnnual,
                  min: 0,
                  max: 1500000,
                  step: 50000,
                  suffix: '',
                },
                {
                  label: 'Signing bonus (one‑time)',
                  value: signing,
                  set: setSigning,
                  min: 0,
                  max: 1200000,
                  step: 50000,
                  suffix: '',
                },
              ].map((row) => (
                <div key={row.label} className="mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-sans font-semibold text-[var(--text)]">{row.label}</div>
                    <div className="text-[var(--accent)] font-semibold">
                      {row.suffix === '%' ? `${row.value}${row.suffix}` : fmt(convert(row.value, baseCurrency, displayCurrency), displayCurrency)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <input
                      type="range"
                      min={row.min}
                      max={row.max}
                      step={row.step}
                      value={row.value}
                      onChange={(e) => row.set(Number(e.target.value))}
                      style={{ ['--pct' as any]: `${((row.value - row.min) / (row.max - row.min)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Total comp (Year 1)</div>
              <div className="mt-2 font-sans text-3xl font-extrabold text-[var(--green)]">{fmt(displayOffer, displayCurrency)}</div>
              <div className="mt-2 text-xs text-[var(--muted)]">vs baseline {fmt(displayCurrent, displayCurrency)}</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Take‑home</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Annual</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Monthly</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome / 12, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
              <div className="text-3xl">{v.emoji}</div>
              <div className="mt-2 font-sans text-lg font-bold text-[var(--accent)]">{v.title}</div>
              <p className="mt-1 text-xs text-[var(--muted)]">{v.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
