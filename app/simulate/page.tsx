import { Suspense } from 'react';
import SimulatorClient from './simulator-client';

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--muted)]">Loading…</div>}>
      <SimulatorClient />
    </Suspense>
  );
}
