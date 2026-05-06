"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import {
  roleOnboarding,
  type RoleOnboardingKey,
} from "@/lib/onboarding-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleOnboardingWizardProps = {
  roleKey: RoleOnboardingKey;
};

export function RoleOnboardingWizard({ roleKey }: RoleOnboardingWizardProps) {
  const content = roleOnboarding[roleKey];
  const [activeStep, setActiveStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const storageKey = `sos:onboarding:${roleKey}`;
  const ActiveIcon = content.icon;
  const currentStep = content.steps[activeStep];
  const CurrentIcon = currentStep.icon;

  useEffect(() => {
    setDismissed(window.localStorage.getItem(storageKey) === "done");
  }, [storageKey]);

  if (dismissed) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-elev-1)]"
    >
      <div className="grid gap-0 lg:grid-cols-[18rem_1fr]">
        <div className="bg-slate-950 p-5 text-white sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(storageKey, "done");
                setDismissed(true);
              }}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar onboarding"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Badge className="mb-4 bg-white/12 text-white hover:bg-white/12">
            {content.badge}
          </Badge>
          <h2 className="text-2xl font-black tracking-tight">{content.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{content.subtitle}</p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-5 grid gap-2 sm:grid-cols-3">
            {content.steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  index === activeStep
                    ? "border-primary bg-emerald-50"
                    : "bg-white hover:bg-slate-50"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                      index === activeStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-black">{step.title}</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </button>
            ))}
          </div>

          <motion.div
            key={currentStep.title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 rounded-2xl border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CurrentIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-black">{currentStep.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {currentStep.description}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0 rounded-xl">
              <Link href={currentStep.href}>
                {currentStep.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-muted-foreground"
              onClick={() => {
                window.localStorage.setItem(storageKey, "done");
                setDismissed(true);
              }}
            >
              <Check className="h-4 w-4" />
              Já entendi
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
