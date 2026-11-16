import type { ComponentProps, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

type TextFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  hint?: string;
};

export function TextField({ id, label, hint, ...input }: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

type SubmitButtonProps = {
  isPending: boolean;
  children: ReactNode;
  className?: string;
};

export function SubmitButton({
  isPending,
  children,
  className,
}: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" disabled={isPending} className={className}>
      {isPending && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  );
}
