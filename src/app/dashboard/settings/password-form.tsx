"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/app/actions/profile";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/auth";

export function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordInput) {
    const result = await changePassword(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ChangePasswordInput, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message ?? "Could not change your password.");
      return;
    }

    reset();
    toast.success(result.message ?? "Password changed.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="currentPassword" required>
          Current password
        </Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          className="mt-2"
          invalid={Boolean(errors.currentPassword)}
          {...register("currentPassword")}
        />
        {errors.currentPassword ? (
          <p className="mt-1.5 text-[13px] text-destructive" role="alert">
            {errors.currentPassword.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="newPassword" required>
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="mt-2"
            invalid={Boolean(errors.newPassword)}
            {...register("newPassword")}
          />
          {errors.newPassword ? (
            <p className="mt-1.5 text-[13px] text-destructive" role="alert">
              {errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
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
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Use at least 10 characters with upper and lower case letters and a number.
        Length matters more than complexity.
      </p>

      <div className="flex justify-end">
        <Button type="submit" variant="outline" loading={isSubmitting}>
          {!isSubmitting ? <KeyRound aria-hidden /> : null}
          Change password
        </Button>
      </div>
    </form>
  );
}
