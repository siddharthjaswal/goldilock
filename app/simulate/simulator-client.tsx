'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { convertCurrency, indiaTax, calcOffer, changePct } from '@/lib/comp';

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
  const offerCountry = params.get('offerCountry') || 'TH';
  const baseCurrency = params.get('currency') || 'USD';
  const currentBase = Number(params.get('base') || 0);
  const currentBonus = Number(params.get('bonus') || 0);
  const currentEquity = Number(params.get('equity') || 0);

  const [rates, setRates] = useState<Record<string, number>>(fallbackRates);
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency === 'THB' ? 'THB' : 'INR');
  const [isTHB, setIsTHB] = useState(baseCurrency === 'THB');

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

  const convert = (amount: number, from: string, to: string) => convertCurrency(amount, from, to, rates);

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

  const offer = calcOffer({ baseMonthly, bonusPct, equityAnnual, signing });
  const offerTC = offer.offerTotal;
  const recurring = offer.recurring;
  const tax = offerCountry === 'IN' ? indiaTax(recurring) : recurring * (taxRates[offerCountry] || 0.2);
  const takeHome = recurring - tax + signing;

  const offerInBase = convert(offerTC, 'THB', baseCurrency);
  const displayCurrent = useMemo(() => convert(currentTC, baseCurrency, displayCurrency), [currentTC, baseCurrency, displayCurrency, rates]);
  const displayOffer = useMemo(() => convert(offerTC, 'THB', displayCurrency), [offerTC, displayCurrency, rates]);

  const pctChange = changePct(offerInBase, currentTC);

  const verdict = () => {
    if (pctChange < 5) return { emoji: '🚨', title: 'Lowball — Walk', desc: 'This doesn’t clear the bar. Push hard or walk.', color: 'var(--red)' };
    if (pctChange < 15) return { emoji: '😬', title: 'Meh — Push Back', desc: 'Marginal improvement. Negotiate base or signing.', color: 'var(--red)' };
    if (pctChange < 30) return { emoji: '✅', title: 'Strong Offer', desc: 'Meaningful step up. Solid if role fits.', color: 'var(--green)' };
    return { emoji: '💎', title: 'Goldmine', desc: 'Exceptional package. Lock it in.', color: '#b040f0' };
  };

  const v = verdict();

  const bars = [
    { id: 'base', label: 'Base', value: offer.baseAnnual },
    { id: 'bonus', label: 'Bonus', value: offer.bonusAnnual },
    { id: 'equity', label: 'RSUs', value: equityAnnual },
    { id: 'sign', label: 'Signing', value: signing },
  ];
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <header className="mb-12 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-sans text-[2.2rem] font-extrabold tracking-tight text-[var(--accent)] leading-[1.1]">Goldilock Simulator</h1>
            <p className="mt-1 text-[0.78rem] uppercase tracking-[0.1em] text-[var(--muted)]">Offer builder + live verdict</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
              <span className={`font-sans text-[0.85rem] font-semibold ${!isTHB ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>₹ INR</span>
              <button
                type="button"
                onClick={() => {
                  const next = !isTHB;
                  setIsTHB(next);
                  setDisplayCurrency(next ? 'THB' : 'INR');
                }}
                className={`relative h-[26px] w-[48px] rounded-full border border-[var(--border)] ${isTHB ? 'bg-[rgba(240,192,64,0.15)] border-[var(--accent)]' : 'bg-[var(--surface2)]'}`}
              >
                <span
                  className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full transition-all duration-300 ${isTHB ? 'translate-x-[20px] bg-[var(--accent)] shadow-[0_0_12px_rgba(240,192,64,0.5)]' : 'bg-[var(--muted)]'}`}
                />
              </button>
              <span className={`font-sans text-[0.85rem] font-semibold ${isTHB ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>฿ THB</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(64,192,240,0.35)] bg-[rgba(64,192,240,0.12)] px-3 py-1 text-[10px] text-[var(--accent2)]">
              <span>⚡</span>
              <span>
                {country === 'IN' ? 'India: New Regime' : `${country}: ${((taxRates[country] || 0.2) * 100).toFixed(0)}%`} ·
                {offerCountry === 'IN' ? ' India: New Regime' : ` ${offerCountry}: ${((taxRates[offerCountry] || 0.2) * 100).toFixed(0)}%`}
              </span>
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
                  { label: 'Base', val: currentBase, sub: 'Annual fixed' },
                  { label: 'Bonus', val: currentBonus, sub: 'Performance' },
                  { label: 'Equity', val: currentEquity, sub: 'Annualized' },
                  { label: 'Total CTC', val: currentTC, sub: 'Pre-tax' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{item.label}</div>
                    <div className={`mt-2 font-sans text-sm font-bold ${item.label === 'Total CTC' ? 'text-[var(--accent2)]' : 'text-[var(--text)]'}`}>
                      {fmt(convert(item.val, baseCurrency, displayCurrency), displayCurrency)}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--muted)]">{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Annual take‑home</div>
                  <div className="mt-1 font-sans text-sm font-bold text-[var(--green)]">
                    {fmt(convert(currentTakeHome, baseCurrency, displayCurrency), displayCurrency)}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--muted)]">After {country === 'IN' ? 'New Regime' : 'Tax'} tax</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Monthly in‑hand</div>
                  <div className="mt-1 font-sans text-sm font-bold text-[var(--green)]">
                    {fmt(convert(currentTakeHome / 12, baseCurrency, displayCurrency), displayCurrency)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
              <div className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">🪙 Agoda Offer Builder — Drag to Negotiate</div>

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
              ].map((row, idx) => (
                <div key={row.label} className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[0.9rem] font-sans font-semibold text-[var(--text)]">
                      {row.label}
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                        {row.tag}
                      </span>
                    </div>
                    <div className="text-[var(--accent)] font-semibold text-[1rem]">
                      {row.suffix === '%' ? `${row.value}${row.suffix}` : fmt(convert(row.value, 'THB', displayCurrency), displayCurrency)}
                    </div>
                  </div>
                  <div className="mt-4">
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
                  <div className="mt-3 flex justify-between text-[0.6rem] text-[var(--muted)]">
                    <span>
                      {row.label === 'Base salary'
                        ? `${fmt(convert(180000, 'THB', displayCurrency), displayCurrency)} · ${row.range[0]}`
                        : row.label === 'Performance bonus'
                        ? `0% · ${row.range[0]}`
                        : row.label === 'Stock / RSUs'
                        ? `${fmt(convert(0, 'THB', displayCurrency), displayCurrency)} · ${row.range[0]}`
                        : `${fmt(convert(0, 'THB', displayCurrency), displayCurrency)} · ${row.range[0]}`}
                    </span>
                    <span>
                      {row.label === 'Base salary'
                        ? `${fmt(convert(280000, 'THB', displayCurrency), displayCurrency)} · ${row.range[1]}`
                        : row.label === 'Performance bonus'
                        ? `15–20% · ${row.range[1]}`
                        : row.label === 'Stock / RSUs'
                        ? `${fmt(convert(850000, 'THB', displayCurrency), displayCurrency)} · ${row.range[1]}`
                        : `${fmt(convert(700000, 'THB', displayCurrency), displayCurrency)} · ${row.range[1]}`}
                    </span>
                    <span>
                      {row.label === 'Base salary'
                        ? `${fmt(convert(380000, 'THB', displayCurrency), displayCurrency)} · ${row.range[2]}`
                        : row.label === 'Performance bonus'
                        ? `30% · ${row.range[2]}`
                        : row.label === 'Stock / RSUs'
                        ? `${fmt(convert(1500000, 'THB', displayCurrency), displayCurrency)} · ${row.range[2]}`
                        : `${fmt(convert(1200000, 'THB', displayCurrency), displayCurrency)} · ${row.range[2]}`}
                    </span>
                  </div>
                  <div className="mt-2 h-[3px] rounded-full overflow-hidden flex">
                    <div className="bg-[var(--red)] flex-[2]" />
                    <div className="bg-[var(--accent)] flex-[3]" />
                    <div className="bg-[var(--green)] flex-[3]" />
                  </div>
                  <div className="mt-1 flex justify-between text-[0.55rem] text-[var(--muted)]">
                    <span>{row.label === 'Base salary' ? '⚠ Below visa floor' : '⚠ Below floor'}</span>
                    <span>✓ Sweet spot</span>
                    <span>★ Exceptional</span>
                  </div>
                  {idx < 3 && <div className="mt-5 h-px bg-[var(--border)]" />}
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
                      {fmt(convert(b.value, 'THB', displayCurrency), displayCurrency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--green)] to-transparent opacity-40" />
              <div className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--muted)]">Total compensation (Year 1)</div>
              <div className="mt-2 font-sans text-[2.4rem] font-extrabold text-[var(--green)] leading-none">{fmt(displayOffer, displayCurrency)}</div>
              <div className="mt-2 text-[0.8rem] text-[var(--muted)]">
                ≈ {fmt(convert(offerTC, 'THB', displayCurrency === 'INR' ? 'THB' : 'INR'), displayCurrency === 'INR' ? 'THB' : 'INR')}
              </div>
              <div className={`mt-3 inline-flex items-center gap-1 rounded-full border px-4 py-1 text-[0.95rem] font-semibold ${pctChange >= 0 ? 'border-[rgba(64,240,160,0.3)] bg-[rgba(64,240,160,0.1)] text-[var(--green)]' : 'border-[rgba(240,64,96,0.3)] bg-[rgba(240,64,96,0.1)] text-[var(--red)]'}`}>
                {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange).toFixed(0)}%
              </div>
              <div className="mt-2 text-[0.62rem] text-[var(--muted)]">vs current {fmt(displayCurrent, displayCurrency)} CTC</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">💸 Take‑home (After Tax)</div>
              <div className="mt-4 space-y-3 text-[0.72rem]">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted)]">Tax regime</span>
                  <span className="font-semibold text-[var(--accent2)]">
                    {offerCountry === 'TH' ? '17% LTR Flat' : offerCountry === 'IN' ? 'New Regime' : `${(taxRates[offerCountry] || 0.2) * 100}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted)]">Gross annual</span>
                  <span className="font-semibold text-[var(--text)]">{fmt(convert(recurring + signing, 'THB', displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted)]">Tax paid</span>
                  <span className="font-semibold text-[var(--red)]">−{fmt(convert(tax, 'THB', displayCurrency), displayCurrency)} ({offerCountry === 'IN' ? 'NR' : `${(taxRates[offerCountry] || 0.2) * 100}%`})</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted)]">Annual in‑hand</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome, 'THB', displayCurrency), displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Monthly in‑hand</span>
                  <span className="font-semibold text-[var(--green)]">{fmt(convert(takeHome / 12, 'THB', displayCurrency), displayCurrency)}</span>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-[rgba(64,240,160,0.2)] bg-[rgba(64,240,160,0.05)] px-3 py-3 text-[0.6rem] text-[var(--muted)]">
                <div className="mb-1">vs India monthly in‑hand</div>
                {(() => {
                  const diff = convert(takeHome / 12, 'THB', baseCurrency) - (currentTakeHome / 12);
                  const label = diff >= 0 ? '+' : '−';
                  const amount = fmt(Math.abs(diff), baseCurrency);
                  return (
                    <div style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: '0.9rem' }}>
                      {label}{amount}/mo {diff >= 0 ? 'more' : 'less'} than India
                    </div>
                  );
                })()}
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
