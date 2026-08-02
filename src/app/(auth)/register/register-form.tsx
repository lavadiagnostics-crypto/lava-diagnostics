"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/app/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

/** Live password policy feedback, mirroring `passwordSchema`. */
function PasswordChecklist({ value }: { value: string }) {
  const rules = [
    { label: "At least 10 characters", pass: value.length >= 10 },
    { label: "A lowercase letter", pass: /[a-z]/.test(value) },
    { label: "An uppercase letter", pass: /[A-Z]/.test(value) },
    { label: "A number", pass: /[0-9]/.test(value) },
  ];

  return (
    <ul className="mt-3 grid grid-cols-2 gap-1.5" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            rule.pass ? "text-[hsl(var(--pass))]" : "text-muted-foreground",
          )}
        >
          <Check
            className={cn(
              "size-3 shrink-0",
              rule.pass ? "opacity-100" : "opacity-30",
            )}
            aria-hidden
          />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: undefined as unknown as true,
    },
  });

  const password = watch("password") ?? "";
  const acceptTerms = watch("acceptTerms");

  async function onSubmit(values: RegisterInput) {
    setFormError(undefined);
    const result = await registerAction(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof RegisterInput, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
      setFormError(result.message);
      toast.error(result.message ?? "Could not create your account.");
      return;
    }

    toast.success("Account created. Please sign in.");
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Create a client account
      </h1>
      <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
        Track orders, download certificates and reorder in one place.
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
          <Label htmlFor="companyName" required>
            Company, organisation or your name
          </Label>
          <Input
            id="companyName"
            autoComplete="organization"
            className="mt-2"
            invalid={Boolean(errors.companyName)}
            {...register("companyName")}
          />
          {errors.companyName ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.companyName.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="contactPerson" required>
            Contact person
          </Label>
          <Input
            id="contactPerson"
            autoComplete="name"
            className="mt-2"
            invalid={Boolean(errors.contactPerson)}
            {...register("contactPerson")}
          />
          {errors.contactPerson ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.contactPerson.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
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
          <Label htmlFor="phone" required>
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="mt-2"
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.phone.message}
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
              autoComplete="new-password"
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
          <PasswordChecklist value={password} />
          {errors.password ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="mt-2"
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={acceptTerms === true}
              onCheckedChange={(checked) =>
                setValue("acceptTerms", (checked === true) as true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5"
            />
            <span className="text-[13px] leading-relaxed">
              I accept the{" "}
              <Link
                href="/legal/terms"
                target="_blank"
                className="font-medium text-lava-600 underline underline-offset-4 dark:text-lava-400"
              >
                terms of service
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="font-medium text-lava-600 underline underline-offset-4 dark:text-lava-400"
              >
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.acceptTerms.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {!isSubmitting ? <UserPlus aria-hidden /> : null}
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-lava-600 underline-offset-4 hover:underline dark:text-lava-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
