import React, { useCallback, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

type FormState = {
  email: string;
  username: string;
  password: string;
};

const initialState: FormState = {
  email: "",
  username: "",
  password: "",
};

function isEmail(s: string) {
  return /\S+@\S+\.\S+/.test(s);
}

async function createAccount(payload: {
  email: string;
  handle: string; // username.hypercerts.climateai.org
  password: string;
}) {
  const res = await fetch("/api/createAccount", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

export default function SignupPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  // ⬇️ NEW: prefill from ?email=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("email");
      if (q && isEmail(q)) {
        setForm((f) => ({ ...f, email: q }));
      }
    } catch {
      // ignore (non-browser env)
    }
  }, []);

  const username = useMemo(
    () => form.username.trim().replace(/^@/, "").toLowerCase(),
    [form.username]
  );

  const handle = useMemo(() => {
    if (!username) return "";
    return `${username}.hypercerts.climateai.org`;
  }, [username]);

  const canSubmit =
    isEmail(form.email) &&
    username.length >= 3 &&
    form.password.length >= 8 &&
    !submitting;

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !handle) return;

      try {
        setSubmitting(true);
        toast.loading("Creating your account…", { id: "signup" });

        await createAccount({
          email: form.email.trim(),
          handle,
          password: form.password,
        });

        toast.success("Account created! You can sign in now.", {
          id: "signup",
        });

        // window.location.href = "/";

        setForm(initialState);
      } catch (err: any) {
        toast.error(err?.message ?? "Something went wrong.", { id: "signup" });
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, handle, form.email, form.password]
  );

  return (
    <div className="min-h-[100svh] bg-black text-white relative overflow-x-clip">
      {/* Background layers for consistency with App.tsx */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(800px_600px_at_70%_20%,#1e1e1e_0%,#0a0a0a_60%,#000_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(transparent_24px,rgba(255,255,255,0.04)_25px),linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.04)_25px)] bg-[size:26px_26px] mix-blend-screen"
      />

      <main className="mx-auto max-w-5xl px-6 py-14">
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[conic-gradient(at_30%_50%,#60a5fa,65%,#a78bfa_85%,#22d3ee)]">
              Create your Hypercerts account
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your handle will be{" "}
            <code className="font-mono">username.hypercerts.climateai.org</code>
            .
          </p>
        </header>

        <section className="relative rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rngba(255,255,255,0.05)]"
                value={form.email}
                onChange={onChange("email")}
                placeholder="you@example.com"
              />
              {!isEmail(form.email) && form.email.length > 0 && (
                <p className="mt-2 text-xs text-red-400">
                  Please enter a valid email.
                </p>
              )}
            </div>

            {/* USERNAME */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 pl-8 pr-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                  value={form.username}
                  onChange={onChange("username")}
                  placeholder="yourname"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  @
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Your handle will be{" "}
                <code className="font-mono">
                  {username
                    ? `${username}.hypercerts.climateai.org`
                    : "yourname.hypercerts.climateai.org"}
                </code>
              </p>
              {username.length > 0 && username.length < 3 && (
                <p className="mt-2 text-xs text-red-400">
                  Username must be at least 3 characters.
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                value={form.password}
                onChange={onChange("password")}
                placeholder="••••••••"
              />
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-2 text-xs text-red-400">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold text-black shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Create account
            </button>

            <p className="text-center text-xs text-zinc-500">
              Already have an account?{" "}
              <a href="/" className="underline hover:text-zinc-300">
                Sign in
              </a>
            </p>
          </form>
        </section>

        <footer className="mt-10 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} — Hypercerts
        </footer>
      </main>
    </div>
  );
}
