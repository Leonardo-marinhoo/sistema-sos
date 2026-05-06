"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { loginOnboardingSteps } from "@/lib/onboarding-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginOnboarding() {
  const [step, setStep] = useState(0);
  const current = loginOnboardingSteps[step];
  const isLast = step === loginOnboardingSteps.length - 1;

  return (
    <section className="w-full max-w-xl rounded-2xl border bg-white/82 p-6 shadow-[var(--shadow-elev-2)] backdrop-blur sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">Onboarding rápido</p>
            <p className="text-xs text-muted-foreground">3 passos antes de entrar</p>
          </div>
        </div>
        <Link
          href="/tutoriais"
          className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
        >
          Ver guia
        </Link>
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
            aria-label={`Ir para passo ${index + 1}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.title}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22 }}
          className="min-h-[13rem]"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-primary">
            {isLast ? <Check className="h-8 w-8" /> : <span className="text-2xl font-black">{step + 1}</span>}
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
            Passo {step + 1}
          </p>
          <h1 className="text-3xl font-black tracking-tight">{current.title}</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            {current.description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl bg-white"
          disabled={step === 0}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        {isLast ? (
          <Button asChild className="rounded-xl">
            <a href="#login">
              Fazer login
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => setStep((value) => Math.min(loginOnboardingSteps.length - 1, value + 1))}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
