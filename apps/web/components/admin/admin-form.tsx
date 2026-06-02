"use client";

import { ReactNode, useTransition } from "react";
import { toast } from "sonner";

interface AdminFormProps {
  action: (formData: FormData) => Promise<any>;
  successMessage?: string;
  className?: string;
  children: ReactNode;
}

export function AdminForm({ action, successMessage = "Saved successfully!", className, children }: AdminFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as any).submitter;
    
    // If the button has a custom formAction, let Next.js handle it naturally (e.g. reordering up/down)
    if (submitter && submitter.hasAttribute("formAction")) {
      return;
    }

    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
      } catch (err: any) {
        toast.error(err?.message || "An error occurred while saving.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className} encType="multipart/form-data">
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
