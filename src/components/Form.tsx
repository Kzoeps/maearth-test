/**
 * ============================================
 * components/Form.tsx (updated CreateHypercertForm)
 * - More apparent inputs (contrast, focus, subtle shadow)
 * - Sticky left rail only on lg+ to avoid mobile weirdness
 * - Removed inner min-h-dvh to prevent nested viewport jank
 * - Added "Fill example" button to auto-populate valid data
 * - Added "Reset" button
 * ============================================
 */

import React, { useMemo, useState } from "react";
import { z } from "zod";

export type ImpactClaim = {
  impact_claim_id: string;
  work_scope: string;
  uri: string[];
  work_start_time: string;
  work_end_time: string;
  description?: string;
  contributors_uri?: string[];
  rights_uri?: string;
  location_uri?: string;
};

const uriSchema = z.string().url({ message: "Must be a valid URI" });
const dateSchema = z
  .string()
  .datetime({ message: "Must be an ISO date-time (RFC3339)" });

const ImpactClaimSchema = z.object({
  impact_claim_id: z.string().min(1).max(255),
  work_scope: z.string().min(1, "Required"),
  uri: z.array(uriSchema).min(1, "At least one URI is required"),
  work_start_time: dateSchema,
  work_end_time: dateSchema,
  description: z.string().optional(),
  contributors_uri: z.array(z.string()).optional(),
  rights_uri: z.string().optional(),
  location_uri: z.string().optional(),
});

export interface CreateHypercertFormProps {
  onSubmit?: (record: ImpactClaim) => void | Promise<void>;
  initial?: Partial<ImpactClaim>;
  disabled?: boolean;
}

function localDateTimeToISO(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    )
  ).toISOString();
}

function isoToLocalDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function CreateHypercertForm({
  onSubmit,
  initial,
  disabled,
}: CreateHypercertFormProps) {
  const [impactClaimId, setImpactClaimId] = useState(
    initial?.impact_claim_id ?? ""
  );
  const [workScope, setWorkScope] = useState(initial?.work_scope ?? "");
  const [uris, setUris] = useState<string[]>(initial?.uri ?? [""]);
  const [startLocal, setStartLocal] = useState(
    isoToLocalDateTime(initial?.work_start_time)
  );
  const [endLocal, setEndLocal] = useState(
    isoToLocalDateTime(initial?.work_end_time)
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contributors, setContributors] = useState<string[]>(
    initial?.contributors_uri ?? []
  );
  const [rightsUri, setRightsUri] = useState(initial?.rights_uri ?? "");
  const [locationUri, setLocationUri] = useState(initial?.location_uri ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const record = useMemo<ImpactClaim>(
    () => ({
      impact_claim_id: impactClaimId.trim(),
      work_scope: workScope.trim(),
      uri: uris.map((u) => u.trim()).filter(Boolean),
      work_start_time: localDateTimeToISO(startLocal),
      work_end_time: localDateTimeToISO(endLocal),
      description: description.trim() || undefined,
      contributors_uri: contributors.map((c) => c.trim()).filter(Boolean),
      rights_uri: rightsUri.trim() || undefined,
      location_uri: locationUri.trim() || undefined,
    }),
    [
      impactClaimId,
      workScope,
      uris,
      startLocal,
      endLocal,
      description,
      contributors,
      rightsUri,
      locationUri,
    ]
  );

  const parseResult = ImpactClaimSchema.safeParse(record);
  const hasErrors = !parseResult.success;

  function setFieldError(path: string, message: string) {
    setErrors((prev) => ({
      ...prev,
      [path]: Array.from(new Set([...(prev[path] ?? []), message])),
    }));
  }

  function validateInline() {
    setErrors({});
    const res = ImpactClaimSchema.safeParse(record);
    if (!res.success) {
      for (const issue of res.error.issues) {
        const key = issue.path.join(".") || "form";
        setFieldError(key, issue.message);
      }
    }
    return res.success;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || submitting) return;
    setErrors({});
    const ok = validateInline();
    if (!ok) return;
    try {
      setSubmitting(true);
      await onSubmit?.(record);
    } finally {
      setSubmitting(false);
    }
  }

  // helpers for dynamic lists
  const updateArray = (
    index: number,
    value: string,
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const next = [...arr];
    next[index] = value;
    setter(next);
  };

  const addRow = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    seed = ""
  ) => setter((a) => [...a, seed]);

  const removeRow = (
    index: number,
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => setter(arr.length > 1 ? arr.filter((_, i) => i !== index) : arr);

  // 🧪 Fill example button
  function fillExample() {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      9,
      0,
      0
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 14,
      17,
      0,
      0
    );

    setImpactClaimId("claim-001-demo");
    setWorkScope("Open-source climate modeling tools");
    setDescription(
      "Released v1.0 of a reproducible climate impact toolkit; documented methods and published benchmarks."
    );
    setUris([
      "https://github.com/example/hypercerts-climate-toolkit",
      "https://example.org/report/2025-q3",
    ]);
    setContributors([
      "did:plc:abcd1234efgh5678",
      "https://bsky.app/profile/alice.example.com",
    ]);
    setRightsUri("https://creativecommons.org/licenses/by/4.0/");
    setLocationUri("https://maps.google.com/?q=Thimphu,Bhutan");
    setStartLocal(isoToLocalDateTime(start.toISOString()));
    setEndLocal(isoToLocalDateTime(end.toISOString()));
    setErrors({});
  }

  function resetForm() {
    setImpactClaimId(initial?.impact_claim_id ?? "");
    setWorkScope(initial?.work_scope ?? "");
    setUris(initial?.uri ?? [""]);
    setStartLocal(isoToLocalDateTime(initial?.work_start_time));
    setEndLocal(isoToLocalDateTime(initial?.work_end_time));
    setDescription(initial?.description ?? "");
    setContributors(initial?.contributors_uri ?? []);
    setRightsUri(initial?.rights_uri ?? "");
    setLocationUri(initial?.location_uri ?? "");
    setErrors({});
  }

  return (
    <div className="bg-[radial-gradient(1200px_600px_at_100%_-10%,#0ea5e9_0%,transparent_50%),radial-gradient(800px_400px_at_-10%_110%,#8b5cf6_0%,transparent_45%),#0b0b12] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8">
        {/* Left rail */}
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 h-max">
          <h2 className="text-xl font-extrabold tracking-tight">
            Create Hypercert
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Fill in the impact claim per the lexicon.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70 list-disc list-inside">
            <li>
              <strong className="text-white/90">Required:</strong>{" "}
              impact_claim_id, work_scope, uri, work_start_time, work_end_time
            </li>
            <li>URIs must be valid links</li>
            <li>Dates are stored as ISO timestamps</li>
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={fillExample}
              type="button"
              className="rounded-xl bg-white text-black font-semibold px-4 py-2.5 hover:opacity-90 active:scale-[0.99]"
            >
              Fill example
            </button>
            <button
              onClick={resetForm}
              type="button"
              className="rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
          <button
            onClick={handleSubmit as any}
            disabled={disabled || submitting}
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 text-black font-semibold px-4 py-3 shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {hasErrors && (
            <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-sm font-semibold text-rose-200">
                Please fix the highlighted fields
              </p>
            </div>
          )}
        </aside>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity */}
          <section className="rounded-2xl border border-white/10 bg-white/5 supports-[backdrop-filter]:backdrop-blur p-6">
            <h3 className="text-lg font-semibold">Identity</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Impact Claim ID"
                required
                error={errors["impact_claim_id"]?.[0]}
              >
                <input
                  value={impactClaimId}
                  onChange={(e) => setImpactClaimId(e.target.value)}
                  className="Input"
                  placeholder="claim-123"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="Work Scope"
                required
                error={errors["work_scope"]?.[0]}
              >
                <input
                  value={workScope}
                  onChange={(e) => setWorkScope(e.target.value)}
                  className=""
                  placeholder="Public goods research, open-source, …"
                  disabled={disabled}
                />
              </Field>
            </div>

            <Field label="Description" optional>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="Input min-h-28"
                placeholder="Describe the work and impact…"
                disabled={disabled}
              />
            </Field>
          </section>

          {/* Resources */}
          <section className="rounded-2xl border border-white/10 bg-white/5 supports-[backdrop-filter]:backdrop-blur p-6">
            <h3 className="text-lg font-semibold">Resources & Links</h3>

            <div className="mt-4 space-y-3">
              <LabelRow
                label="URI (one or more)"
                required
                error={errors["uri"]?.[0]}
              />
              {uris.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={u}
                    onChange={(e) =>
                      updateArray(i, e.target.value, uris, setUris)
                    }
                    className={`Input flex-1 ${
                      errors["uri"] ? "ring-2 ring-rose-400/60" : ""
                    }`}
                    placeholder="https://…"
                    disabled={disabled}
                  />
                  <IconButton
                    title="Remove"
                    onClick={() => removeRow(i, uris, setUris)}
                    disabled={disabled}
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(setUris)}
                className="BtnGhost"
                disabled={disabled}
              >
                + Add URI
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <LabelRow label="Contributors URI (optional)" />
              {contributors.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={c}
                    onChange={(e) =>
                      updateArray(
                        i,
                        e.target.value,
                        contributors,
                        setContributors
                      )
                    }
                    className="Input flex-1"
                    placeholder="did:plc:… or https://…"
                    disabled={disabled}
                  />
                  <IconButton
                    title="Remove"
                    onClick={() => removeRow(i, contributors, setContributors)}
                    disabled={disabled}
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(setContributors)}
                className="BtnGhost"
                disabled={disabled}
              >
                + Add Contributor
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Rights URI" optional>
                <input
                  value={rightsUri}
                  onChange={(e) => setRightsUri(e.target.value)}
                  className="Input"
                  placeholder="https://license.example.com/…"
                  disabled={disabled}
                />
              </Field>
              <Field label="Location URI" optional>
                <input
                  value={locationUri}
                  onChange={(e) => setLocationUri(e.target.value)}
                  className="Input"
                  placeholder="https://maps.example.com/… or geo:…"
                  disabled={disabled}
                />
              </Field>
            </div>
          </section>

          {/* Timing */}
          <section className="rounded-2xl border border-white/10 bg-white/5 supports-[backdrop-filter]:backdrop-blur p-6">
            <h3 className="text-lg font-semibold">Timing</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Work Start"
                required
                error={errors["work_start_time"]?.[0]}
              >
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="Input"
                  disabled={disabled}
                />
              </Field>
              <Field
                label="Work End"
                required
                error={errors["work_end_time"]?.[0]}
              >
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="Input"
                  disabled={disabled}
                />
              </Field>
            </div>
          </section>

          {/* Live Preview */}
          <section className="rounded-2xl border border-white/10 bg-white/5 supports-[backdrop-filter]:backdrop-blur p-6">
            <h3 className="text-lg font-semibold">JSON Preview</h3>
            <pre className="mt-4 rounded-xl bg-black/60 p-4 text-sm overflow-auto">
              {JSON.stringify(record, null, 2)}
            </pre>
            {!hasErrors ? (
              <p className="mt-2 text-emerald-300 text-sm">
                Record matches lexicon constraints.
              </p>
            ) : (
              <p className="mt-2 text-rose-300 text-sm">
                Record has validation errors.
              </p>
            )}
          </section>

          <div className="h-10" />
        </form>
      </div>

      {/* Tailwind component tokens (higher contrast + clearer focus) */}
      <style>{`
        .Input { @apply w-full rounded-2xl bg-white/10 border border-white/25 px-3 py-3 outline-none placeholder:text-white/50 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:ring-2 focus:ring-sky-400/70 focus:border-transparent; }
        .BtnGhost { @apply rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 transition; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  optional,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm text-white/80">
          {label}
          {required && <span className="ml-1 text-rose-300">*</span>}
          {optional && <span className="ml-1 text-white/40">(optional)</span>}
        </label>
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LabelRow({
  label,
  required,
  error,
}: {
  label: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </span>
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}

function IconButton({
  title,
  children,
  onClick,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-white/20 bg-white/10 w-10 h-10 grid place-items-center text-xl hover:bg-white/20 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
