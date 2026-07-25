"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Info,
  Plane,
  RefreshCw,
  Save,
  ShieldQuestion,
  Trash2,
  UserPen,
  X
} from "lucide-react";
import type React from "react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  AwardSource,
  Cabin,
  CashFareInput,
  CommuteComparisonResponse,
  CommuteOption,
  CommuteOptionType,
  OnloadCategory,
  StaffFareInput
} from "@/lib/search-schema";

type SearchForm = {
  originIata: string;
  destinationIata: string;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
  bufferMinutes: number;
  cabin: Cabin;
  seatCount: number;
  onloadCategory: OnloadCategory;
  seniorityYears: number;
  source: AwardSource;
  staffFare: ManualFareForm;
  cashFare: ManualFareForm;
};

type ManualFareForm = {
  enabled: boolean;
  amount: string;
  currency: string;
  carrier: string;
  flightNumber: string;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
  cabin: Cabin;
  bookByDate: string;
  bookByTime: string;
  note: string;
};

type SavedCommute = SearchForm & {
  id: string;
  label: string;
  createdAt: string;
  lastRunAt: string | null;
};

type Status = "empty" | "loading" | "populated" | "partial" | "zero" | "error";

const airports = [
  "AKL Auckland", "BNE Brisbane", "DOH Doha", "DXB Dubai", "HKG Hong Kong", "LAX Los Angeles",
  "LHR London Heathrow", "MEL Melbourne", "PER Perth", "SIN Singapore", "SYD Sydney", "SFO San Francisco"
];
const columnOrder: CommuteOptionType[] = ["standby", "staffFare", "cash", "award"];

const today = new Date();
const tomorrow = new Date(Date.now() + 36 * 60 * 60 * 1000);

const initialManualFare: ManualFareForm = {
  enabled: false,
  amount: "",
  currency: "AUD",
  carrier: "",
  flightNumber: "",
  departDate: today.toISOString().slice(0, 10),
  departTime: "09:00",
  arriveDate: tomorrow.toISOString().slice(0, 10),
  arriveTime: "13:00",
  cabin: "economy",
  bookByDate: today.toISOString().slice(0, 10),
  bookByTime: "18:00",
  note: ""
};

const initialForm: SearchForm = {
  originIata: "SYD",
  destinationIata: "MEL",
  departDate: today.toISOString().slice(0, 10),
  departTime: "06:00",
  arriveDate: tomorrow.toISOString().slice(0, 10),
  arriveTime: "18:00",
  bufferMinutes: 90,
  cabin: "economy",
  seatCount: 1,
  onloadCategory: "C",
  seniorityYears: 3,
  source: "CACHED",
  staffFare: { ...initialManualFare, carrier: "QF", flightNumber: "QF401", amount: "129" },
  cashFare: { ...initialManualFare, carrier: "VA", flightNumber: "VA824", amount: "219", arriveTime: "14:15" }
};

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function money(cents: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

function formatBuffer(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function amountToCents(value: string) {
  return Math.round(Number(value || 0) * 100);
}

function farePayload(fare: ManualFareForm): Omit<CashFareInput, "id"> | null {
  if (!fare.enabled) return null;
  return {
    amountCents: amountToCents(fare.amount),
    currency: fare.currency,
    carrier: fare.carrier || "User entered",
    flightNumber: fare.flightNumber || "TBA",
    departsAt: toIso(fare.departDate, fare.departTime),
    arrivesAt: toIso(fare.arriveDate, fare.arriveTime),
    cabin: fare.cabin,
    note: fare.note
  };
}

function staffFarePayload(fare: ManualFareForm): StaffFareInput[] {
  const payload = farePayload(fare);
  if (!payload) return [];
  return [{
    ...payload,
    bookByAt: fare.bookByDate && fare.bookByTime ? toIso(fare.bookByDate, fare.bookByTime) : undefined
  }];
}

function cashFarePayload(fare: ManualFareForm): CashFareInput[] {
  const payload = farePayload(fare);
  return payload ? [payload] : [];
}

export function RepositionApp() {
  const [form, setForm] = useState<SearchForm>(initialForm);
  const [comparison, setComparison] = useState<CommuteComparisonResponse | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [error, setError] = useState("");
  const [activeColumn, setActiveColumn] = useState<CommuteOptionType>("standby");
  const [selected, setSelected] = useState<CommuteOption | null>(null);
  const [saved, setSaved] = useState<SavedCommute[]>([]);
  const [label, setLabel] = useState("Home base commute");
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("reposition:saved-commutes");
    if (stored) setSaved(JSON.parse(stored) as SavedCommute[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("reposition:saved-commutes", JSON.stringify(saved));
  }, [saved]);

  const payload = useMemo(() => ({
    originIata: form.originIata,
    destinationIata: form.destinationIata,
    departAfter: toIso(form.departDate, form.departTime),
    arriveBefore: toIso(form.arriveDate, form.arriveTime),
    bufferMinutes: form.bufferMinutes,
    cabin: form.cabin,
    seatCount: form.seatCount,
    onloadCategory: form.onloadCategory,
    seniorityYears: form.seniorityYears,
    source: form.source,
    staffFares: staffFarePayload(form.staffFare),
    cashFares: cashFarePayload(form.cashFare)
  }), [form]);

  async function runSearch(nextForm = form, savedId?: string) {
    setForm(nextForm);
    setStatus("loading");
    setError("");
    setComparison(null);
    const nextPayload = {
      originIata: nextForm.originIata,
      destinationIata: nextForm.destinationIata,
      departAfter: toIso(nextForm.departDate, nextForm.departTime),
      arriveBefore: toIso(nextForm.arriveDate, nextForm.arriveTime),
      bufferMinutes: nextForm.bufferMinutes,
      cabin: nextForm.cabin,
      seatCount: nextForm.seatCount,
      onloadCategory: nextForm.onloadCategory,
      seniorityYears: nextForm.seniorityYears,
      source: nextForm.source,
      staffFares: staffFarePayload(nextForm.staffFare),
      cashFares: cashFarePayload(nextForm.cashFare)
    };

    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPayload)
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.message ?? "Comparison failed.");
      setStatus("error");
      return;
    }
    setComparison(body);
    setStatus(body.state);
    if (savedId) {
      setSaved((items) => items.map((item) => item.id === savedId ? { ...item, lastRunAt: new Date().toISOString() } : item));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  function saveCommute() {
    const item: SavedCommute = { ...form, id: crypto.randomUUID(), label, createdAt: new Date().toISOString(), lastRunAt: null };
    setSaved((items) => [item, ...items]);
  }

  function deleteCommute(item: SavedCommute) {
    if (!window.confirm(`Delete ${item.label}?`)) return;
    setSaved((items) => items.filter((savedItem) => savedItem.id !== item.id));
  }

  function rerunCommute(item: SavedCommute) {
    const exists = saved.some((savedItem) => savedItem.id === item.id);
    if (!exists) {
      setError("That saved commute is no longer available for this demo user.");
      setStatus("error");
      return;
    }
    void runSearch(item, item.id);
  }

  return (
    <main className="min-h-screen bg-surface-page text-body text-text-primary">
      <header className="bg-brand-700 text-neutral-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-h-11 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-card bg-neutral-0 text-brand-700"><Plane aria-hidden size={22} /></div>
            <div>
              <p className="text-caption uppercase">Self-funded crew commuting</p>
              <h1 className="text-h1">Reposition</h1>
            </div>
          </div>
          <p className="hidden text-bodySmall sm:block">Demo user · MEL base</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[370px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-card bg-surface-raised p-4 shadow-sm">
            <h2 className="text-h2">Compare commute options</h2>
            <p className="mt-1 text-bodySmall text-text-secondary">Standby, staff fare, cash, and award routes are ranked inside their own columns against report time.</p>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <AirportField label="Origin" value={form.originIata} onChange={(originIata) => setForm({ ...form, originIata })} />
              <AirportField label="Destination" value={form.destinationIata} onChange={(destinationIata) => setForm({ ...form, destinationIata })} />
              <div className="grid grid-cols-2 gap-3">
                <Field id="depart-date" label="Depart date" hint="Start of search window"><input className="input" type="date" value={form.departDate} onChange={(e) => setForm({ ...form, departDate: e.target.value })} required /></Field>
                <Field id="depart-time" label="After" hint="Local time"><input className="input" type="time" value={form.departTime} onChange={(e) => setForm({ ...form, departTime: e.target.value })} required /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="arrive-date" label="Report date" hint="Hard arrive-before date"><input className="input" type="date" value={form.arriveDate} onChange={(e) => setForm({ ...form, arriveDate: e.target.value })} required /></Field>
                <Field id="arrive-time" label="Before" hint="Report deadline"><input className="input" type="time" value={form.arriveTime} onChange={(e) => setForm({ ...form, arriveTime: e.target.value })} required /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="buffer" label="Buffer" hint="Minutes before report"><input className="input" type="number" min={0} max={720} value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })} /></Field>
                <Field id="seats" label="Seats" hint="1 to 4 seats"><input className="input" type="number" min={1} max={4} value={form.seatCount} onChange={(e) => setForm({ ...form, seatCount: Number(e.target.value) })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="cabin" label="Cabin" hint="Preferred cabin"><CabinSelect value={form.cabin} onChange={(cabin) => setForm({ ...form, cabin })} /></Field>
                <Field id="onload" label="Onload" hint="Self-declared priority"><select className="input" value={form.onloadCategory} onChange={(e) => setForm({ ...form, onloadCategory: e.target.value as OnloadCategory })}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></Field>
              </div>
              <Field id="seniority" label="Seniority" hint="Years used for standby estimate"><input className="input" type="number" min={0} max={50} value={form.seniorityYears} onChange={(e) => setForm({ ...form, seniorityYears: Number(e.target.value) })} /></Field>
              <SourceControl value={form.source} onChange={(source) => setForm({ ...form, source })} />
              <ManualFareEditor title="Staff confirmed fare" kind="staff" value={form.staffFare} onChange={(staffFare) => setForm({ ...form, staffFare })} />
              <ManualFareEditor title="Cash fare" kind="cash" value={form.cashFare} onChange={(cashFare) => setForm({ ...form, cashFare })} />
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-action-primary px-4 font-semibold text-neutral-0 hover:bg-action-hover focus-visible:outline-neutral-0" type="submit">
                <RefreshCw aria-hidden size={18} /> Compare commute
              </button>
            </form>
          </section>

          <section className="rounded-card bg-surface-raised p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-h2">Saved commutes</h2>
              <button className="icon-button" aria-label="Save current commute" onClick={saveCommute}><Save size={18} /></button>
            </div>
            <input aria-label="Saved commute label" className="input mt-3" value={label} onChange={(e) => setLabel(e.target.value)} />
            <div className="mt-3 space-y-2">
              {saved.length === 0 ? <p className="text-bodySmall text-text-secondary">No saved commutes yet.</p> : saved.map((item) => (
                <div className="rounded-card border border-border-decorative p-3" key={item.id}>
                  <p className="font-semibold">{item.label}</p>
                  <p className="font-mono text-data text-text-secondary">{item.originIata} to {item.destinationIata}</p>
                  <p className="text-caption text-text-secondary">Last run {item.lastRunAt ? formatTime(item.lastRunAt) : "not yet"}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="small-button" onClick={() => rerunCommute(item)}>Re-run</button>
                    <button className="icon-button" aria-label={`Delete ${item.label}`} onClick={() => deleteCommute(item)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-h-[560px] rounded-card bg-surface-raised p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-decorative pb-4">
            <div>
              <h2 className="text-h2">Commute comparison</h2>
              <p className="text-bodySmall text-text-secondary">Hard-filtered by report deadline, with tight arrivals flagged instead of hidden.</p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-card bg-brand-50 px-3 text-bodySmall text-brand-700"><Info size={17} /> No cross-column score</div>
          </div>
          <ResultsState
            activeColumn={activeColumn}
            comparison={comparison}
            error={error}
            form={payload}
            onColumnChange={setActiveColumn}
            onOpen={(option, opener) => { openerRef.current = opener; setSelected(option); }}
            status={status}
          />
        </section>
      </div>
      {selected ? <OptionDetail option={selected} onClose={() => { setSelected(null); openerRef.current?.focus(); }} /> : null}
    </main>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: React.ReactNode }) {
  return <label className="block text-bodySmall font-semibold" htmlFor={id}>{label}<span className="mt-1 block">{children}</span><span id={`${id}-hint`} className="mt-1 block text-caption text-text-secondary">{hint}</span></label>;
}

function AirportField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `${label.toLowerCase()}-iata`;
  return (
    <Field id={id} label={label} hint="Three-letter IATA code">
      <input id={id} className="input font-mono uppercase" list={`${label}-airports`} value={value} maxLength={3} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-describedby={`${id}-hint`} required />
      <datalist id={`${label}-airports`}>{airports.map((airport) => <option key={airport} value={airport.slice(0, 3)}>{airport}</option>)}</datalist>
    </Field>
  );
}

function CabinSelect({ value, onChange }: { value: Cabin; onChange: (value: Cabin) => void }) {
  return <select id="cabin" className="input" value={value} onChange={(e) => onChange(e.target.value as Cabin)} aria-describedby="cabin-hint"><option value="economy">Economy</option><option value="premium">Premium</option><option value="business">Business</option><option value="first">First</option></select>;
}

function SourceControl({ value, onChange }: { value: AwardSource; onChange: (source: AwardSource) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Award source">
      {(["CACHED", "LIVE"] as const).map((source) => (
        <button key={source} type="button" className={`min-h-11 rounded-card border px-3 text-bodySmall font-semibold ${value === source ? "border-action-primary bg-accent-50 text-action-primary" : "border-border-interactive bg-neutral-0"}`} onClick={() => onChange(source)}>{source === "CACHED" ? "Cached awards" : "Live awards"}</button>
      ))}
    </div>
  );
}

function ManualFareEditor({ title, kind, value, onChange }: { title: string; kind: "staff" | "cash"; value: ManualFareForm; onChange: (value: ManualFareForm) => void }) {
  return (
    <section className="rounded-card border border-border-decorative p-3">
      <label className="flex min-h-11 items-center gap-3 text-bodySmall font-semibold">
        <input type="checkbox" checked={value.enabled} onChange={(e) => onChange({ ...value, enabled: e.target.checked })} />
        Add {title.toLowerCase()}
      </label>
      {value.enabled ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${kind}-amount`} label="Fare" hint="Amount"><input id={`${kind}-amount`} className="input" type="number" min={0} value={value.amount} onChange={(e) => onChange({ ...value, amount: e.target.value })} aria-describedby={`${kind}-amount-hint`} /></Field>
            <Field id={`${kind}-currency`} label="Currency" hint="ISO code"><input id={`${kind}-currency`} className="input uppercase" maxLength={3} value={value.currency} onChange={(e) => onChange({ ...value, currency: e.target.value.toUpperCase() })} aria-describedby={`${kind}-currency-hint`} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${kind}-carrier`} label="Carrier" hint="Optional"><input id={`${kind}-carrier`} className="input uppercase" value={value.carrier} onChange={(e) => onChange({ ...value, carrier: e.target.value.toUpperCase() })} aria-describedby={`${kind}-carrier-hint`} /></Field>
            <Field id={`${kind}-flight`} label="Flight" hint="Optional"><input id={`${kind}-flight`} className="input uppercase" value={value.flightNumber} onChange={(e) => onChange({ ...value, flightNumber: e.target.value.toUpperCase() })} aria-describedby={`${kind}-flight-hint`} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${kind}-depart-date`} label="Depart" hint="Date"><input id={`${kind}-depart-date`} className="input" type="date" value={value.departDate} onChange={(e) => onChange({ ...value, departDate: e.target.value })} aria-describedby={`${kind}-depart-date-hint`} /></Field>
            <Field id={`${kind}-depart-time`} label="Time" hint="Local"><input id={`${kind}-depart-time`} className="input" type="time" value={value.departTime} onChange={(e) => onChange({ ...value, departTime: e.target.value })} aria-describedby={`${kind}-depart-time-hint`} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${kind}-arrive-date`} label="Arrive" hint="Date"><input id={`${kind}-arrive-date`} className="input" type="date" value={value.arriveDate} onChange={(e) => onChange({ ...value, arriveDate: e.target.value })} aria-describedby={`${kind}-arrive-date-hint`} /></Field>
            <Field id={`${kind}-arrive-time`} label="Time" hint="Local"><input id={`${kind}-arrive-time`} className="input" type="time" value={value.arriveTime} onChange={(e) => onChange({ ...value, arriveTime: e.target.value })} aria-describedby={`${kind}-arrive-time-hint`} /></Field>
          </div>
          <Field id={`${kind}-cabin`} label="Cabin" hint="Fare cabin"><select id={`${kind}-cabin`} className="input" value={value.cabin} onChange={(e) => onChange({ ...value, cabin: e.target.value as Cabin })} aria-describedby={`${kind}-cabin-hint`}><option value="economy">Economy</option><option value="premium">Premium</option><option value="business">Business</option><option value="first">First</option></select></Field>
          {kind === "staff" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field id="staff-book-date" label="Book by" hint="Date"><input id="staff-book-date" className="input" type="date" value={value.bookByDate} onChange={(e) => onChange({ ...value, bookByDate: e.target.value })} aria-describedby="staff-book-date-hint" /></Field>
              <Field id="staff-book-time" label="Deadline" hint="Local"><input id="staff-book-time" className="input" type="time" value={value.bookByTime} onChange={(e) => onChange({ ...value, bookByTime: e.target.value })} aria-describedby="staff-book-time-hint" /></Field>
            </div>
          ) : null}
          <Field id={`${kind}-note`} label="Note" hint="Shown as user-entered provenance"><input id={`${kind}-note`} className="input" value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} aria-describedby={`${kind}-note-hint`} /></Field>
        </div>
      ) : null}
    </section>
  );
}

function ResultsState(props: {
  activeColumn: CommuteOptionType;
  comparison: CommuteComparisonResponse | null;
  error: string;
  form: { originIata: string; destinationIata: string };
  onColumnChange: (column: CommuteOptionType) => void;
  onOpen: (option: CommuteOption, opener: HTMLButtonElement) => void;
  status: Status;
}) {
  const { activeColumn, comparison, error, form, onColumnChange, onOpen, status } = props;
  if (status === "empty") return <StateMessage icon={<Plane />} title="Ready to compare" body="Enter the commute and report deadline to compare self-funded ways to get to base." />;
  if (status === "loading") return <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">{[1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-card bg-neutral-100" />)}</div>;
  if (status === "zero") return <StateMessage icon={<Clock3 />} title="No option lands in time" body="Try an earlier departure window, a later report deadline, or add manual fare options that arrive before report." />;
  if (status === "error") return <StateMessage icon={<AlertTriangle />} title="Comparison needs attention" body={error} />;
  if (!comparison) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 rounded-card border border-column-standby bg-clearance-likely-bg p-3 text-bodySmall text-clearance-likely-text">
        <div className="flex gap-2"><Database className="mt-0.5 shrink-0" size={17} /><p>Standby load figures are seeded demo data for {form.originIata} to {form.destinationIata}. Award data is sourced from seats.aero and may be cached.</p></div>
      </div>
      <div className="grid grid-cols-4 gap-2 md:hidden" role="tablist" aria-label="Comparison columns">
        {columnOrder.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={activeColumn === key} className={`min-h-11 rounded-card border px-2 text-caption font-semibold ${activeColumn === key ? "border-action-primary bg-accent-50 text-action-primary" : "border-border-interactive bg-neutral-0"}`} onClick={() => onColumnChange(key)}>
            {shortColumnLabel(key)}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columnOrder.map((key) => (
          <ComparisonColumn key={key} hiddenOnMobile={activeColumn !== key} column={comparison.columns[key]} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function ComparisonColumn({ column, hiddenOnMobile, onOpen }: { column: CommuteComparisonResponse["columns"][CommuteOptionType]; hiddenOnMobile: boolean; onOpen: (option: CommuteOption, opener: HTMLButtonElement) => void }) {
  return (
    <section className={`${hiddenOnMobile ? "hidden md:block" : "block"} min-h-72 rounded-card border border-border-decorative bg-neutral-0`} aria-labelledby={`${column.key}-title`}>
      <div className={`border-l-4 p-3 ${columnBorder(column.key)}`}>
        <h3 id={`${column.key}-title`} className="text-h3">{column.label}</h3>
        <p className="mt-1 flex items-center gap-1 text-caption text-text-secondary">{provenanceIcon(column.provenance)} {provenanceLabel(column.provenance)}</p>
      </div>
      <div className="space-y-3 p-3">
        {column.options.length === 0 ? (
          <div className="rounded-card border border-dashed border-border-decorative p-3 text-bodySmall text-text-secondary">
            {column.prompt ?? "No option in this column lands before report time."}
          </div>
        ) : column.options.map((option) => <OptionCard key={option.id} option={option} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function OptionCard({ option, onOpen }: { option: CommuteOption; onOpen: (option: CommuteOption, opener: HTMLButtonElement) => void }) {
  return (
    <button className="min-h-44 w-full rounded-card border border-border-decorative p-3 text-left hover:border-action-primary focus-visible:outline-focus-ring" onClick={(event) => onOpen(option, event.currentTarget)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-data text-text-secondary">#{option.rank} · {option.flightNumber}</p>
          <p className="font-semibold">{option.originIata} to {option.destinationIata}</p>
        </div>
        <ChevronRight className="shrink-0 text-text-secondary" aria-hidden size={19} />
      </div>
      <p className="mt-2 text-bodySmall text-text-secondary">{formatTime(option.departsAt)} · arrives {formatTime(option.arrivesAt)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge option={option} />
        {option.ranking.isTightBuffer ? <span className="inline-flex min-h-8 items-center gap-1 rounded-control bg-clearance-uncertain-bg px-2 text-caption font-semibold text-clearance-uncertain-text"><Clock3 size={14} /> Tight</span> : null}
      </div>
      <p className="mt-3 text-bodySmall">{optionSummary(option)}</p>
    </button>
  );
}

function Badge({ option }: { option: CommuteOption }) {
  const icon = option.certainty === "confirmed" ? <CheckCircle2 size={14} /> : option.certainty === "expired" ? <AlertTriangle size={14} /> : <ShieldQuestion size={14} />;
  return <span className={`inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-caption font-semibold ${certaintyClass(option)}`}>{icon}{certaintyLabel(option)}</span>;
}

function OptionDetail({ option, onClose }: { option: CommuteOption; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40" role="presentation">
      <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="detail-title" onKeyDown={onKeyDown} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-overlay bg-surface-raised p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-data text-text-secondary">{option.flightNumber}</p>
            <h2 id="detail-title" className="text-h1">{option.title}</h2>
          </div>
          <button ref={closeRef} className="icon-button" aria-label="Close detail" onClick={onClose}><X size={19} /></button>
        </div>
        <dl className="mt-6 divide-y divide-border-decorative border-y border-border-decorative">
          <Detail label="Carrier" value={option.carrier} />
          <Detail label="Departs" value={formatTime(option.departsAt)} />
          <Detail label="Arrives" value={formatTime(option.arrivesAt)} />
          <Detail label="Cabin" value={option.cabin} />
          <Detail label="Buffer" value={formatBuffer(option.ranking.arrivalBufferMinutes)} />
          <Detail label="Certainty" value={certaintyLabel(option)} />
          <Detail label="Provenance" value={provenanceLabel(option.provenance)} />
          {option.type === "standby" ? <StandbyDetails option={option} /> : null}
          {option.type === "staffFare" ? <><Detail label="Fare" value={money(option.amountCents, option.currency)} /><Detail label="Book by" value={option.bookByAt ? formatTime(option.bookByAt) : "Not entered"} /><Detail label="Expiry" value={option.isExpired ? "Expired" : "Open"} /></> : null}
          {option.type === "cash" ? <Detail label="Fare" value={money(option.amountCents, option.currency)} /> : null}
          {option.type === "award" ? <><Detail label="Program" value={option.program} /><Detail label="Mileage" value={`${option.mileageCost.toLocaleString()} points`} /><Detail label="Taxes" value={money(option.taxesCents)} /><Detail label="Seats remaining" value={`${option.seatsRemaining}`} /><Detail label="Freshness" value={`${option.source.toLowerCase()} · ${formatTime(option.fetchedAt)}`} /></> : null}
        </dl>
        <section className="mt-6 rounded-card bg-brand-50 p-4">
          <h3 className="text-h3">Why it ranks here</h3>
          <ul className="mt-2 space-y-2 text-bodySmall">
            {option.ranking.factors.map((factor) => <li key={factor}>{factor}</li>)}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function StandbyDetails({ option }: { option: Extract<CommuteOption, { type: "standby" }> }) {
  return (
    <>
      <Detail label="Clearance" value={option.clearance} />
      <Detail label="Taxes" value={money(option.taxesCents)} />
      <Detail label="Capacity" value={`${option.load.capacity}`} />
      <Detail label="Booked seats" value={`${option.load.bookedSeats}`} />
      <Detail label="Likely open" value={`${option.load.seatsLikelyOpen}`} />
      <Detail label="Non-revs listed" value={`${option.load.nonRevsListed}`} />
      <Detail label="Adjusted ahead" value={`${option.load.adjustedNonRevsAhead}`} />
      <Detail label="Onload" value={option.load.onloadCategory} />
      <Detail label="Seniority" value={`${option.load.seniorityYears} years`} />
      <Detail label="Seeded note" value={option.load.notes} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-2 gap-4 py-3"><dt className="text-bodySmall text-text-secondary">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}

function StateMessage({ icon, title, body }: { icon: React.ReactElement; title: string; body: string }) {
  return <div className="mt-10 grid place-items-center text-center"><div className="grid size-12 place-items-center rounded-card bg-brand-50 text-brand-700">{icon}</div><h3 className="mt-4 text-h2">{title}</h3><p className="mt-2 max-w-md text-bodySmall text-text-secondary">{body}</p></div>;
}

function shortColumnLabel(key: CommuteOptionType) {
  return ({ standby: "Standby", staffFare: "Staff", cash: "Cash", award: "Award" } as const)[key];
}

function columnBorder(key: CommuteOptionType) {
  return ({ standby: "border-column-standby", staffFare: "border-column-staff", cash: "border-column-cash", award: "border-column-award" } as const)[key];
}

function provenanceIcon(provenance: string) {
  if (provenance === "user-entered") return <UserPen size={14} />;
  if (provenance.startsWith("seats-aero")) return <CalendarClock size={14} />;
  return <Database size={14} />;
}

function provenanceLabel(provenance: string) {
  return ({
    "seeded-demo": "Seeded demo data",
    "user-entered": "User-entered",
    "seats-aero-cached": "seats.aero cached",
    "seats-aero-live": "seats.aero live"
  } as Record<string, string>)[provenance] ?? provenance;
}

function certaintyLabel(option: CommuteOption) {
  if (option.type === "standby") return `${option.clearance} standby estimate`;
  return ({ confirmed: "Confirmed", speculative: "Speculative", expired: "Expired", "seeded-estimated": "Seeded estimate" } as const)[option.certainty];
}

function certaintyClass(option: CommuteOption) {
  if (option.certainty === "expired") return "bg-clearance-unlikely-bg text-clearance-unlikely-text";
  if (option.type === "standby" && option.clearance === "LIKELY") return "bg-clearance-likely-bg text-clearance-likely-text";
  if (option.type === "standby" && option.clearance === "UNLIKELY") return "bg-clearance-unlikely-bg text-clearance-unlikely-text";
  if (option.type === "standby") return "bg-clearance-uncertain-bg text-clearance-uncertain-text";
  return "bg-brand-50 text-brand-700";
}

function optionSummary(option: CommuteOption) {
  if (option.type === "standby") return `${option.clearance.toLowerCase()} clearance · ${money(option.taxesCents)} taxes · seeded load`;
  if (option.type === "staffFare") return `${money(option.amountCents, option.currency)} · ${option.isExpired ? "booking deadline passed" : "bookable staff fare"}`;
  if (option.type === "cash") return `${money(option.amountCents, option.currency)} · user-entered cash fare`;
  return `${option.mileageCost.toLocaleString()} points + ${money(option.taxesCents)} · ${option.seatsRemaining} seats`;
}
