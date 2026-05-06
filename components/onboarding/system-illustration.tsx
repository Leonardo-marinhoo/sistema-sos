import { CheckCircle2, HardHat, Shield, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

type SystemIllustrationProps = {
  variant?: "compact" | "wide";
  className?: string;
};

export function SystemIllustration({
  variant = "wide",
  className,
}: SystemIllustrationProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[var(--shadow-elev-2)] backdrop-blur",
        variant === "compact" ? "min-h-[17rem]" : "min-h-[24rem]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,122,92,0.12),rgba(14,165,233,0.10)_45%,rgba(255,255,255,0.28))]" />
      <div className="relative grid h-full gap-4">
        <div className="flex items-center justify-between rounded-xl border bg-white/85 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Sistema SOS</p>
              <p className="text-xs text-muted-foreground">Treinamento guiado</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
            MVP pronto para operar
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {["Superadmin", "Admin Empresa", "Técnico", "Colaborador"].map(
              (label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border bg-white/75 px-3 py-3 shadow-sm"
                  style={{ transform: `translateX(${index % 2 ? 10 : 0}px)` }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    {index === 2 ? (
                      <HardHat className="h-4 w-4" />
                    ) : (
                      <UsersRound className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{label}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${88 - index * 13}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="rounded-xl border bg-slate-950 p-4 text-white shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-200">
                  Fluxo recomendado
                </p>
                <p className="text-lg font-bold">Implantação segura</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="space-y-3">
              {[
                "Criar empresa",
                "Cadastrar admins",
                "Configurar cargos",
                "Entregar EPIs",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-300"
                      style={{ width: `${94 - index * 12}%` }}
                    />
                  </div>
                  <span className="w-28 text-xs text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {variant === "wide" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Empresas", "12 ativas"],
              ["Usuários", "146 pessoas"],
              ["EPIs", "38 modelos"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white/75 p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
