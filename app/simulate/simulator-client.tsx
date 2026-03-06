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
  US: 0.28,
  UK: 0.3,
  SG: 0.12,
  TH: 0.17,
  AE: 0.0,
  DE: 0.32,
};

const indiaTax = (income: number) => {
  const taxable = Math.max(0, income - 75000);
  let tax = 0;
  const slabs: Array<[number, number]> = [
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
  const currentTax = country === 'IN' ? indiaTax(currentTC) : currentTC * (taxRates[country] || 0.2);
  const currentTakeHome = currentTC - currentTax;

  const baseAnnual = baseMonthly * 12;
  const bonusAnnual = baseAnnual * (bonusPct / 100);
  const offerTC = baseAnnual + bonusAnnual + equityAnnual + signing;
  const recurring = baseAnnual + bonusAnnual + equityAnnual;
  const tax = country === 'IN' ? indiaTax(recurring) : recurring * (taxRates[country] || 0.2);
  const takeHome = recurring - tax + signing;

  const displayCurrent = useMemo(() => convert(currentTC, baseCurrency, displayCurrency), [currentTC, baseCurrency, displayCurrency, rates]);
  const displayOffer = useMemo(() => convert(offerTC, baseCurrency, displayCurrency), [offerTC, baseCurrency, displayCurrency, rates]);

  const changePct = ((offerTC - currentTC) / Math.max(currentTC, 1)) * 100;

  const verdict = () => {
    if (changePct < 5) return { emoji: '🚨', title: 'Lowball — Walk', desc: 'This doesn’t clear the bar. Push hard or walk.', color: 'var(--red)' };
    if (changePct < 15) return { emoji: '😬', title: 'Meh — Push Back', desc: 'Marginal improvement. Negotiate base or signing.', color: 'var(--red)' };
    if (changePct < 30) return { emoji: '✅', title: 'Strong Offer', desc: 'Meaningful step up. Solid if role fits.', color: 'var(--green)' };
    return { emoji: '💎', title: 'Goldmine', desc: 'Exceptional package. Lock it in.', color: '#b040f0' };
  };

  const v = verdict();

  const bars = [
    { id: 'base', label: 'Base', value: baseAnnual },
    { id: 'bonus', label: 'Bonus', value: bonusAnnual },
    { id: 'equity', label: 'RSUs', value: equityAnnual },
    { id: 'sign', label: 'Signing', value: signing },
  ];
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-[var(--accent)]">Goldilock Simulator</h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">Offer builder + live verdict</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
              <span className={`text-[11px] font-semibold ${displayCurrency === baseCurrency ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                {baseCurrency}
              </span>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-3 py-1 text-[10px] text-[var(--text)]"
              >
                {Object.keys(fallbackRates).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(64,192,240,0.35)] bg-[rgba(64,192,240,0.12)] px-3 py-1 text-[10px] text-[var(--accent2)]">
              <span>⚡</span>
              <span>Cloud‑free · Local‑only</span>
            </div>
            <Link href="/" className="text-[10px] text-[var(--muted)] underline">Edit baseline</Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
              <div className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">Current compensation</div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Base', val: currentBase },
                  { label: 'Bonus', val: currentBonus },
                  { label: 'Equity', val: currentEquity },
                  { label: 'Total', val: currentTC },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{item.label}</div>
                    <div className={`mt-2 font-sans text-sm font-bold ${item.label === 'Total' ? 'text-[var(--accent2)]' : 'text-[var(--text)]'}`}>
                      {fmt(convert(item.val, baseCurrency, displayCurrency), displayCurrency)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4 flex justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Annual take‑home</div>
                  <div className="mt-1 font-sans text-sm font-bold text-[var(--green)]">{fmt(convert(currentTakeHome, baseCurrency, displayCurrency), displayCurrency)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Tax rate</div>
                  <div className="mt-1 text-xs text-[var(--red)]">
                    {country === 'IN' ? 'New Regime' : `${(taxRates[country] || 0.2) * 100}%`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
              <div className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">Offer builder — drag to negotiate</div>

              {[
                {
                  label: 'Base salary',
                  tag: 'Monthly',
                  value: baseMonthly,
                  set: setBaseMonthly,
                  min: 180000,
                  max: 380000,
                  step: 5000,
                  range: ['Lowball', 'Target', 'Goldmine'],
                  suffix: '',
                },
                {
                  label: 'Performance bonus',
                  tag: '% of base',
                  value: bonusPct,
                  set: setBonusPct,
                  min: 0,
                  max: 30,
                  step: 1,
                  range: ['None', 'Standard', 'Top band'],
                  suffix: '%',
                },
                {
                  label: 'Stock / RSUs',
                  tag: 'Annual grant',
                  value: equityAnnual,
                  set: setEquityAnnual,
                  min: 0,
                  max: 1500000,
                  step: 50000,
                  range: ['No equity', 'Target', 'Exceptional'],
                  suffix: '',
                },
                {
                  label: 'Signing bonus',
                  tag: 'One‑time',
                  value: signing,
                  set: setSigning,
                  min: 0,
                  max: 1200000,
                  step: 50000,
                  range: ['Not covered', 'ESOP whole', 'Full upside'],
                  suffix: '',
                },
              ].map((row) => (
                <div key={row.label} className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-sans font-semibold text-[var(--text)]">
                      {row.label}
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        {row.tag}
                      </span>
                    </div>
                    <div className="text-[var(--accent)] font-semibold text-sm">
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
                  <div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]">
                    <span>
                      {row.label === 'Base salary'
                        ? `฿180k · ${row.range[0]}`
                        : row.label === 'Performance bonus'
                        ? `0% · ${row.range[0]}`
                        : row.label === 'Stock / RSUs'
                        ? `฿0 · ${row.range[0]}`
                        : `฿0 · ${row.range[0]}`}
                    </span>
                    <span>
                      {row.label === 'Base salary'
                        ? `฿280k · ${row.range[1]}`
                        : row.label === 'Performance bonus'
                        ? `15–20% · ${row.range[1]}`
                        : row.label === 'Stock / RSUs'
                        ? `฿850k · ${row.range[1]}`
                        : `฿700k · ${row.range[1]}`}
                    </span>
                    <span>
                      {row.label === 'Base salary'
                        ? `฿380k · ${row.range[2]}`
                        : row.label === 'Performance bonus'
                        ? `30% · ${row.range[2]}`
                        : row.label === 'Stock / RSUs'
                        ? `฿1.5M · ${row.range[2]}`
                        : `฿1.2M · ${row.range[2]}`}
                    </span>
                  </div>
                  <div className="mt-2 h-[3px] rounded-full overflow-hidden flex">
                    <div className="bg-[var(--red)] flex-[2]" />
                    <div className="bg-[var(--accent)] flex-[3]" />
                    <div className="bg-[var(--green)] flex-[3]" />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-[var(--muted)]">
                    <span>⚠ Below floor</span>
                    <span>✓ Sweet spot</span>
                    <span>★ Exceptional</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Comp breakdown</div>
              <div className="space-y-3">
                {bars.map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-14 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{b.label}</div>
                    <div className="flex-1 h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(b.value / maxBar) * 100}%`,
                          background: b.id === 'base' ? 'var(--accent2)' : b.id === 'bonus' ? 'var(--accent)' : b.id === 'equity' ? 'var(--green)' : '#b040f0',
                        }}
                      />
                    </div>
                    <div className="w-20 text-right text-xs font-semibold text-[var(--text)]">
                      {fmt(convert(b.value, baseCurrency, displayCurrency), displayCurrency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--green)] to-transparent opacity-40" />
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Total compensation (Year 1)</div>
              <div className="mt-2 font-sans text-4xl font-extrabold text-[var(--green)]">{fmt(displayOffer, displayCurrency)}</div>
              <div className={`mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${changePct >= 0 ? 'border-[rgba(64,240,160,0.3)] bg-[rgba(64,240,160,0.1)] text-[var(--green)]' : 'border-[rgba(240,64,96,0.3)] bg-[rgba(240,64,96,0.1)] text-[var(--red)]'}`}>
                {changePct >= 0 ? '↑' : '↓'} {Math.abs(changePct).toFixed(0)}%
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">vs baseline {fmt(displayCurrent, displayCurrency)}</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Take‑home after tax</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Gross annual</span>
                  <span className="font-semibold text-[var(--text)]">{fmt(convert(recurring + signing, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Tax paid</span>
                  <span className="font-semibold text-[var(--red)]">−{fmt(convert(tax, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Annual in‑hand</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Monthly in‑hand</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome / 12, baseCurrency, displayCurrency), displayCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
              <div className="text-3xl">{v.emoji}</div>
              <div className="mt-2 font-sans text-lg font-extrabold" style={{ color: v.color }}>{v.title}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{v.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
