"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm({
  redirectTo,
  initialError,
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>(
    initialError,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(undefined);

    const result = await loginAction(values, redirectTo);

    // A successful sign-in redirects server-side, so reaching here is a failure.
    if (!result.ok) {
      setFormError(result.message);
      toast.error(result.message ?? "Sign-in failed.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Client sign-in</h1>
      <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
        Access your orders, certificates and invoices.
      </p>

      {formError ? (
        <div
          className="mt-7 flex gap-3 rounded-2xl border border-destructive/35 bg-destructive/[0.05] p-4"
          role="alert"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed text-destructive">
            {formError}
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-5"
      >
        <div>
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="mt-2"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-11"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {!isSubmitting ? <LogIn aria-hidden /> : null}
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-lava-600 underline-offset-4 hover:underline dark:text-lava-400"
        >
          Create one
        </Link>
      </p>

      <div className="rule-fade my-8" />

      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
        You do not need an account to{" "}
        <Link
          href="/submit"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          submit samples
        </Link>{" "}
        or to{" "}
        <Link
          href="/verify"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          verify a certificate
        </Link>
        .
      </p>
    </div>
  );
}
