"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SuccessCheck } from "@/components/shared/motion";
import { submitContactForm } from "@/app/actions/contact";
import { contactSchema, type ContactInput } from "@/lib/validations/misc";

/** Field error message, wired to the input via aria-describedby. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-destructive" role="alert">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      subject: "",
      body: "",
      website: "",
    },
  });

  async function onSubmit(values: ContactInput) {
    const result = await submitContactForm(values);

    if (!result.ok) {
      // Map server-side field errors back onto the form.
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ContactInput, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message ?? "Something went wrong.");
      return;
    }

    reset();
    setSubmitted(true);
    toast.success("Message sent.");
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-border bg-muted/35 px-6 py-16 text-center">
        <SuccessCheck />
        <h2 className="mt-7 text-xl font-semibold tracking-tight">
          Your message has reached the laboratory
        </h2>
        <p className="mt-3 max-w-sm text-balance text-[15px] leading-relaxed text-muted-foreground">
          We have sent a confirmation to your email address. Technical enquiries
          are answered by an analyst, typically within one business day.
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/*
        Honeypot. Hidden from sight and from assistive technology, but present
        in the DOM for naive bots to fill in.
      */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" required>
            Your name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            className="mt-2"
            invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <FieldError id="name-error" message={errors.name?.message} />
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
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="company">Company or organisation</Label>
          <Input
            id="company"
            autoComplete="organization"
            className="mt-2"
            {...register("company")}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="mt-2"
            {...register("phone")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subject" required>
          Subject
        </Label>
        <Input
          id="subject"
          className="mt-2"
          placeholder="e.g. Method suitability for a cyclic peptide"
          invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          {...register("subject")}
        />
        <FieldError id="subject-error" message={errors.subject?.message} />
      </div>

      <div>
        <Label htmlFor="body" required>
          Your message
        </Label>
        <Textarea
          id="body"
          rows={7}
          className="mt-2"
          placeholder="Tell us about your sample, the question you need answered, and any deadline you are working to."
          invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "body-error" : undefined}
          {...register("body")}
        />
        <FieldError id="body-error" message={errors.body?.message} />
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          We use your details only to answer this enquiry. We do not add
          enquirers to marketing lists.
        </p>
        <Button type="submit" size="lg" loading={isSubmitting}>
          {!isSubmitting ? <Send aria-hidden /> : null}
          Send message
        </Button>
      </div>
    </form>
  );
}
