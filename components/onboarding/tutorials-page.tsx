"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck } from "lucide-react";
import { loginOnboardingSteps } from "@/lib/onboarding-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TutorialsPage() {
  const [step, setStep] = useState(0);
  const current = loginOnboardingSteps[step];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-2xl rounded-2xl border bg-white/86 p-6 shadow-[var(--shadow-elev-2)] backdrop-blur sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">Guia rápido</p>
              <p className="text-xs text-muted-foreground">Sistema SOS</p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl bg-white">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex gap-2">
          {loginOnboardingSteps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "h-2 flex-1 rounded-full transition",
                index <= step ? "bg-primary" : "bg-slate-200"
              )}
            />
          ))}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
          Passo {step + 1}
        </p>
        <h1 className="text-3xl font-black tracking-tight">{current.title}</h1>
        <p className="mt-4 min-h-[5rem] text-base leading-7 text-muted-foreground">
          {current.description}
        </p>

        <div className="mt-8 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl bg-white"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Voltar
          </Button>
          {step === loginOnboardingSteps.length - 1 ? (
            <Button asChild className="rounded-xl">
              <Link href="/login">
                Fazer login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => setStep((value) => Math.min(loginOnboardingSteps.length - 1, value + 1))}
            >
              Próximo
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
