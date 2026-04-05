"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FormWithToastProps {
  children: React.ReactNode;
  action: (formData: FormData) => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  className?: string;
}

export function FormWithToast({
  children,
  action,
  successMessage = "Operação realizada com sucesso!",
  errorMessage = "Ocorreu um erro. Tente novamente.",
  redirectTo,
  onSuccess,
  className,
}: FormWithToastProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
        formRef.current?.reset();
        onSuccess?.();
        if (redirectTo) {
          router.push(redirectTo);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        toast.error(message);
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className={className}>
      {children}
    </form>
  );
}
