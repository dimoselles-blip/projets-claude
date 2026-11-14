"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { Field, FormAlert } from "@/components/ui/form";
import { initialActionState, type ActionState } from "@/lib/action-state";

type Ctx = ActionState & { pending: boolean };
export const ActionFormContext = createContext<Ctx | null>(null);

/**
 * Formulaire relié à une Server Action (useActionState).
 * On soumet via onSubmit pour que React ne vide pas les champs en cas d'erreur de validation.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <ActionFormContext.Provider value={{ ...state, pending }}>
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const fd = new FormData(e.currentTarget, submitter);
          formAction(fd);
        }}
      >
        {children}
      </form>
    </ActionFormContext.Provider>
  );
}

export function FormField({ name, label, hint, children, className }: { name: string; label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  const ctx = useContext(ActionFormContext);
  return (
    <Field label={label} htmlFor={name} hint={hint} error={ctx?.fieldErrors?.[name]} className={className}>
      {children}
    </Field>
  );
}

export function FieldError({ name }: { name: string }) {
  const ctx = useContext(ActionFormContext);
  const error = ctx?.fieldErrors?.[name];
  return error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null;
}

export function FormStatus({ className }: { className?: string }) {
  const ctx = useContext(ActionFormContext);
  if (!ctx || (!ctx.error && !(ctx.ok && ctx.message))) return null;
  return (
    <div className={className}>
      <FormAlert error={ctx.error} message={ctx.ok ? ctx.message : undefined} />
    </div>
  );
}
