import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/" });
  }, [isPending, user, navigate]);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    try {
      if (mode === "daftar") {
        const res = await authClient.signUp.email({ email, password, name: name || email });
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message);
      }
      window.location.assign(import.meta.env.BASE_URL || "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-80px] size-[420px] rounded-full bg-accent-soft/70" />
        <div className="absolute bottom-[-120px] right-[-80px] size-[380px] rounded-full bg-input-amber/80" />
      </div>
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            PPh Pasal 21 · TER PP 58/2023
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-ink">
            Hitung pajak karyawan dengan ketelitian spreadsheet.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Pajak21 meniru logika buku kerja Excel PPh 21 — TER bulanan, rekonsiliasi Desember,
            bukti potong, dan ringkasan setahun — dalam antarmuka yang rapi untuk staf payroll.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-fg">
            {[
              "Tarif Efektif Rata-rata A / B / C sesuai status PTKP",
              "Gross-up, BPJS, biaya jabatan, dan Pasal 17 akhir tahun",
              "Spreadsheet penghasilan Jan–Des tersimpan per akun",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent text-accent-fg">
              <BrandMark />
            </span>
            <div>
              <p className="font-display text-xl text-ink">Pajak21</p>
              <p className="text-xs text-muted">Masuk untuk membuka buku kerja Anda</p>
            </div>
          </div>

          {!authEnabled ? (
            <p className="text-sm text-muted">Sign-in dinonaktifkan.</p>
          ) : (
            <>
              <div className="grid gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  >
                    Lanjutkan dengan {p.label}
                  </Button>
                ))}
              </div>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
                <span className="h-px flex-1 bg-border" />
                atau email
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="mb-4 grid grid-cols-2 rounded-[12px] bg-computed p-1">
                {(["masuk", "daftar"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`h-9 rounded-[10px] text-sm font-semibold capitalize ${
                      mode === m ? "bg-elevated text-ink shadow-soft" : "text-muted"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <form className="space-y-3" onSubmit={onEmail}>
                {mode === "daftar" && (
                  <Field label="Nama">
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>
                )}
                <Field label="Email">
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Kata sandi">
                  <Input
                    type="password"
                    autoComplete={mode === "daftar" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
                <Button type="submit" className="mt-2 w-full" disabled={busy}>
                  {busy ? "Memproses…" : mode === "daftar" ? "Buat akun" : "Masuk"}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M6 8h20v3H6zM6 14.5h12v3H6zM6 21h20v3H6z" fill="currentColor" />
    </svg>
  );
}
