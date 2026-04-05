"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { LogIn, Shield } from "lucide-react";
import { signIn, type LoginActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, action, isPending] = useActionState(signIn, initialState);      

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.35 }}
      className="flex w-full max-w-[26rem] flex-col gap-6 rounded-[2rem] border bg-card/60 p-8 shadow-sm backdrop-blur-xl"     
    >
      <div className="flex flex-col items-center justify-center space-y-3 mb-2 text-center">
        <div className="bg-primary/10 p-3 rounded-2xl mb-2">
           <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">
             Platforma de Seguranca
           </p>
           <h1 className="text-3xl font-black text-foreground tracking-tight">SOS System</h1>
           <p className="text-sm text-muted-foreground mt-2">
             Acesso seguro com email e senha.
           </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
            Email
          </label>
          <Input
            required
            type="email"
            name="email"
            placeholder="nome@empresa.com"
            className="h-12 bg-background/50 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
            Senha
          </label>
          <Input
            required
            type="password"
            name="password"
            placeholder="********"
            className="h-12 bg-background/50 rounded-xl"
          />
        </div>
      </div>

      {state.error ? (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {state.error}
        </motion.p>
      ) : null}

      <Button
        disabled={isPending}
        type="submit"
        className="h-12 w-full mt-2 rounded-xl text-base font-bold"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Entrando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Acessar Sistema
          </span>
        )}
      </Button>
    </motion.form>
  );
}
