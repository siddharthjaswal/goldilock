'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'CAD', 'AUD', 'THB', 'AED'];
const countries = [
  { code: 'IN', name: 'India', tax: 0.22 },
  { code: 'US', name: 'United States', tax: 0.28 },
  { code: 'UK', name: 'United Kingdom', tax: 0.3 },
  { code: 'SG', name: 'Singapore', tax: 0.12 },
  { code: 'TH', name: 'Thailand', tax: 0.17 },
  { code: 'AE', name: 'UAE', tax: 0.0 },
  { code: 'DE', name: 'Germany', tax: 0.32 },
];

export default function Home() {
  const router = useRouter();
  const [country, setCountry] = useState('IN');
  const [currency, setCurrency] = useState('INR');
  const [base, setBase] = useState('');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');

  const handleContinue = () => {
    const params = new URLSearchParams({
      country,
      currency,
      base,
      bonus,
      equity,
    });
    router.push(`/simulate?${params.toString()}`);
  };

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-[var(--accent)]">Goldilock Zone</h1>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">Know your baseline before you negotiate</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(64,192,240,0.35)] bg-[rgba(64,192,240,0.12)] px-3 py-1 text-[10px] text-[var(--accent2)]">
            <span>⚡</span>
            <span>Cloud‑free · Local‑only</span>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
            <div className="mb-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">Current compensation</div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-[var(--muted)]">
                Country
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[var(--muted)]">
                Currency
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[var(--muted)]">
                Base salary (annual)
                <input
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  placeholder="e.g. 5400000"
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>

              <label className="text-xs text-[var(--muted)]">
                Bonus (annual)
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="e.g. 350000"
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>

              <label className="text-xs text-[var(--muted)]">
                Equity (annualized)
                <input
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  placeholder="e.g. 1250000"
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>

              <label className="text-xs text-[var(--muted)]">
                Tax profile
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]">
                  {countries.find((c) => c.code === country)?.name} · {country === 'IN' ? 'New Regime' : `${(countries.find((c) => c.code === country)?.tax || 0) * 100}%`}
                </div>
              </label>
            </div>

            <button
              onClick={handleContinue}
              className="mt-8 w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-105"
            >
              Continue →
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">What you’ll get</div>
            <ul className="space-y-3 text-sm text-[var(--text)]">
              <li>• Live offer simulation with sliders</li>
              <li>• Take‑home breakdown after tax</li>
              <li>• Verdict engine that calls out lowballs</li>
              <li>• Currency toggle with live FX</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
