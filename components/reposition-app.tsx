"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, Info, Plane, RefreshCw, Save, Trash2, X } from "lucide-react";
import type React from "react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { RankedResult } from "@/lib/ranking";
import type { Cabin } from "@/lib/search-schema";

type SearchForm = {
  originIata: string;
  destinationIata: string;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
  cabin: Cabin;
  seatCount: number;
  source: "CACHED" | "LIVE";
};

type SavedSearch = SearchForm & {
  id: string;
  label: string;
  createdAt: string;
  lastRunAt: string | null;
};

const airports = [
  "AKL Auckland", "BNE Brisbane", "DOH Doha", "DXB Dubai", "HKG Hong Kong", "LAX Los Angeles",
  "LHR London Heathrow", "MEL Melbourne", "PER Perth", "SIN Singapore", "SYD Sydney", "SFO San Francisco"
];

const initialForm: SearchForm = {
  originIata: "SYD",
  destinationIata: "MEL",
  departDate: new Date().toISOString().slice(0, 10),
  departTime: "08:00",
  arriveDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString().slice(0, 10),
  arriveTime: "18:00",
  cabin: "economy",
  seatCount: 1,
  source: "CACHED"
};

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function money(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "AUD" }).format(cents / 100);
}

export function RepositionApp() {
  const [form, setForm] = useState<SearchForm>(initialForm);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [status, setStatus] = useState<"empty" | "loading" | "populated" | "zero" | "error">("empty");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RankedResult | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [label, setLabel] = useState("Home positioning");
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("reposition:saved-searches");
    if (stored) setSaved(JSON.parse(stored) as SavedSearch[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("reposition:saved-searches", JSON.stringify(saved));
  }, [saved]);

  const grouped = useMemo(() => {
    return results.reduce<Record<string, RankedResult[]>>((groups, result) => {
      groups[result.program] = groups[result.program] ?? [];
      groups[result.program].push(result);
      return groups;
    }, {});
  }, [results]);

  async function runSearch(nextForm = form, savedId?: string) {
    setForm(nextForm);
    setStatus("loading");
    setError("");
    const payload = {
      originIata: nextForm.originIata,
      destinationIata: nextForm.destinationIata,
      departAfter: toIso(nextForm.departDate, nextForm.departTime),
      arriveBefore: toIso(nextForm.arriveDate, nextForm.arriveTime),
      cabin: nextForm.cabin,
      seatCount: nextForm.seatCount,
      source: nextForm.source
    };

    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.message ?? "Search failed.");
      setStatus("error");
      return;
    }
    setResults(body.results);
    setStatus(body.results.length ? "populated" : "zero");
    if (savedId) {
      setSaved((items) => items.map((item) => item.id === savedId ? { ...item, lastRunAt: new Date().toISOString() } : item));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  function saveSearch() {
    const item: SavedSearch = { ...form, id: crypto.randomUUID(), label, createdAt: new Date().toISOString(), lastRunAt: null };
    setSaved((items) => [item, ...items]);
  }

  return (
    <main className="min-h-screen bg-surface-page text-body text-text-primary">
      <header className="bg-brand-700 text-neutral-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-h-11 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-card bg-neutral-0 text-brand-700"><Plane aria-hidden size={22} /></div>
            <div>
              <p className="text-caption uppercase">Crew award positioning</p>
              <h1 className="text-h1">Reposition</h1>
            </div>
          </div>
          <p className="hidden text-bodySmall sm:block">Demo user · MEL base</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-card bg-surface-raised p-4 shadow-sm">
            <h2 className="text-h2">Find a seat</h2>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <AirportField label="Origin" value={form.originIata} onChange={(originIata) => setForm({ ...form, originIata })} />
              <AirportField label="Destination" value={form.destinationIata} onChange={(destinationIata) => setForm({ ...form, destinationIata })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Depart date"><input className="input" type="date" value={form.departDate} onChange={(e) => setForm({ ...form, departDate: e.target.value })} required /></Field>
                <Field label="After"><input className="input" type="time" value={form.departTime} onChange={(e) => setForm({ ...form, departTime: e.target.value })} required /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Arrive date"><input className="input" type="date" value={form.arriveDate} onChange={(e) => setForm({ ...form, arriveDate: e.target.value })} required /></Field>
                <Field label="Before"><input className="input" type="time" value={form.arriveTime} onChange={(e) => setForm({ ...form, arriveTime: e.target.value })} required /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cabin"><select className="input" value={form.cabin} onChange={(e) => setForm({ ...form, cabin: e.target.value as Cabin })}><option value="economy">Economy</option><option value="premium">Premium</option><option value="business">Business</option><option value="first">First</option></select></Field>
                <Field label="Seats"><input className="input" type="number" min={1} max={4} value={form.seatCount} onChange={(e) => setForm({ ...form, seatCount: Number(e.target.value) })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Search freshness">
                {(["CACHED", "LIVE"] as const).map((source) => (
                  <button key={source} type="button" className={`min-h-11 rounded-card border px-3 text-bodySmall font-semibold ${form.source === source ? "border-action-primary bg-accent-50 text-action-primary" : "border-border-interactive bg-neutral-0"}`} onClick={() => setForm({ ...form, source })}>{source === "CACHED" ? "Cached" : "Live"}</button>
                ))}
              </div>
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-action-primary px-4 font-semibold text-neutral-0 hover:bg-action-hover focus-visible:outline-neutral-0" type="submit">
                <RefreshCw aria-hidden size={18} /> Search availability
              </button>
            </form>
          </section>

          <section className="rounded-card bg-surface-raised p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-h2">Saved</h2>
              <button className="icon-button" aria-label="Save current search" onClick={saveSearch}><Save size={18} /></button>
            </div>
            <input aria-label="Saved search label" className="input mt-3" value={label} onChange={(e) => setLabel(e.target.value)} />
            <div className="mt-3 space-y-2">
              {saved.length === 0 ? <p className="text-bodySmall text-text-secondary">No saved searches yet.</p> : saved.map((item) => (
                <div className="rounded-card border border-border-decorative p-3" key={item.id}>
                  <p className="font-semibold">{item.label}</p>
                  <p className="font-mono text-data text-text-secondary">{item.originIata} → {item.destinationIata}</p>
                  <p className="text-caption text-text-secondary">Last run {item.lastRunAt ? formatTime(item.lastRunAt) : "not yet"}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="small-button" onClick={() => runSearch(item, item.id)}>Re-run</button>
                    <button className="icon-button" aria-label={`Delete ${item.label}`} onClick={() => setSaved((items) => items.filter((savedItem) => savedItem.id !== item.id))}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-h-[560px] rounded-card bg-surface-raised p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-decorative pb-4">
            <div>
              <h2 className="text-h2">Ranked seats</h2>
              <p className="text-bodySmall text-text-secondary">Sorted by arrival buffer first, then points and cabin fit.</p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-card bg-brand-50 px-3 text-bodySmall text-brand-700"><Info size={17} /> {form.source === "CACHED" ? "Cached default" : "Live request"}</div>
          </div>
          <ResultsState status={status} error={error} grouped={grouped} onOpen={(result, opener) => { openerRef.current = opener; setSelected(result); }} />
        </section>
      </div>
      {selected ? <ResultDetail result={selected} onClose={() => { setSelected(null); openerRef.current?.focus(); }} /> : null}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-bodySmall font-semibold">{label}<span className="mt-1 block">{children}</span></label>;
}

function AirportField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input className="input font-mono uppercase" list={`${label}-airports`} value={value} maxLength={3} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-describedby={`${label}-hint`} required />
      <datalist id={`${label}-airports`}>{airports.map((airport) => <option key={airport} value={airport.slice(0, 3)}>{airport}</option>)}</datalist>
      <span id={`${label}-hint`} className="mt-1 block text-caption text-text-secondary">Three-letter IATA code</span>
    </Field>
  );
}

function ResultsState({ status, error, grouped, onOpen }: { status: string; error: string; grouped: Record<string, RankedResult[]>; onOpen: (result: RankedResult, opener: HTMLButtonElement) => void }) {
  if (status === "empty") return <StateMessage icon={<Plane />} title="Ready for a positioning search" body="Enter the crew member's route and hard arrival deadline to see available seats." />;
  if (status === "loading") return <div className="mt-5 space-y-3" aria-live="polite">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-card bg-neutral-100" />)}</div>;
  if (status === "zero") return <StateMessage icon={<Clock3 />} title="No seats land in time" body="Try widening the arrival window, lowering the cabin, or checking live availability." />;
  if (status === "error") return <StateMessage icon={<AlertTriangle />} title="Search needs attention" body={error} />;

  return (
    <div className="mt-5 space-y-6">
      {Object.entries(grouped).map(([program, items]) => (
        <section key={program}>
          <h3 className="text-h3">{program}</h3>
          <ul className="mt-2 divide-y divide-border-decorative rounded-card border border-border-decorative">
            {items.map((result) => <ResultRow key={result.id} result={result} onOpen={onOpen} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function StateMessage({ icon, title, body }: { icon: React.ReactElement; title: string; body: string }) {
  return <div className="mt-10 grid place-items-center text-center"><div className="grid size-12 place-items-center rounded-card bg-brand-50 text-brand-700">{icon}</div><h3 className="mt-4 text-h2">{title}</h3><p className="mt-2 max-w-md text-bodySmall text-text-secondary">{body}</p></div>;
}

function ResultRow({ result, onOpen }: { result: RankedResult; onOpen: (result: RankedResult, opener: HTMLButtonElement) => void }) {
  const limited = result.seatsRemaining <= 2;
  return (
    <li className="p-3">
      <button className="flex min-h-20 w-full items-center gap-3 text-left" onClick={(event) => onOpen(result, event.currentTarget)}>
        <div className={`grid size-11 shrink-0 place-items-center rounded-card ${limited ? "bg-accent-50 text-state-limited" : "bg-brand-50 text-state-available"}`}>{limited ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-data">{result.flightNumber}</p>
            <p className="font-semibold">{result.originIata} → {result.destinationIata}</p>
            <p className="text-caption text-text-secondary">{result.fitScore} fit</p>
          </div>
          <p className="text-bodySmall text-text-secondary">{formatTime(result.departsAt)} · arrives {formatTime(result.arrivesAt)}</p>
          <p className="text-bodySmall"><span className="font-mono text-data">{result.mileageCost.toLocaleString()}</span> points + {money(result.taxesCents)} · {result.seatsRemaining} seats · {result.explanation.summary}</p>
        </div>
        <ChevronRight className="shrink-0 text-text-secondary" aria-hidden size={20} />
      </button>
    </li>
  );
}

function ResultDetail({ result, onClose }: { result: RankedResult; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40" role="presentation">
      <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="detail-title" onKeyDown={onKeyDown} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-overlay bg-surface-raised p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-data text-text-secondary">{result.flightNumber}</p>
            <h2 id="detail-title" className="text-h1">{result.originIata} to {result.destinationIata}</h2>
          </div>
          <button className="icon-button" aria-label="Close detail" onClick={onClose}><X size={19} /></button>
        </div>
        <dl className="mt-6 divide-y divide-border-decorative border-y border-border-decorative">
          <Detail label="Program" value={result.program} />
          <Detail label="Carrier" value={result.carrier} />
          <Detail label="Departs" value={formatTime(result.departsAt)} />
          <Detail label="Arrives" value={formatTime(result.arrivesAt)} />
          <Detail label="Cabin" value={result.cabin} />
          <Detail label="Seats remaining" value={`${result.seatsRemaining}`} />
          <Detail label="Mileage" value={`${result.mileageCost.toLocaleString()} points`} />
          <Detail label="Taxes" value={money(result.taxesCents)} />
          <Detail label="Freshness" value={`${result.source.toLowerCase()} · ${formatTime(result.fetchedAt)}`} />
        </dl>
        <section className="mt-6 rounded-card bg-brand-50 p-4">
          <h3 className="text-h3">Why it ranks here</h3>
          <p className="mt-2 text-bodySmall">{result.explanation.summary}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-caption">
            <span className="rounded-control bg-neutral-0 p-2">Arrival {result.explanation.arrivalScore}</span>
            <span className="rounded-control bg-neutral-0 p-2">Cost {result.explanation.costScore}</span>
            <span className="rounded-control bg-neutral-0 p-2">Cabin {result.explanation.cabinScore}</span>
          </div>
        </section>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-2 gap-4 py-3"><dt className="text-bodySmall text-text-secondary">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
