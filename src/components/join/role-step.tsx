import { StepActions } from "@/components/join/step-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";

type Props = {
  guestName: string;
  roles: { id: string; name: string }[];
  selected: string | null;
  onSelect: (roleId: string) => void;
  onBack: () => void;
  onContinue: () => void;
  dict: Dictionary["join"];
};

export function RoleStep({
  guestName,
  roles,
  selected,
  onSelect,
  onBack,
  onContinue,
  dict,
}: Props) {
  const firstName = guestName.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-1 flex-col duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-center">
        <p
          data-slot="eyebrow"
          className="mb-2 text-xs font-medium text-muted-foreground"
        >
          {format(dict.roleGreeting, { name: firstName })}
        </p>
        <h1
          data-slot="page-title"
          className="font-heading text-3xl leading-tight tracking-tight text-balance"
        >
          {dict.roleTitle}
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {roles.map((role) => (
          <Button
            key={role.id}
            type="button"
            variant={role.id === selected ? "default" : "outline"}
            aria-pressed={role.id === selected}
            onClick={() => onSelect(role.id)}
            className="h-auto min-h-[76px] px-3 whitespace-normal"
          >
            {role.name}
          </Button>
        ))}
      </div>

      <StepActions
        backLabel={dict.back}
        nextLabel={dict.continue}
        onBack={onBack}
        onNext={onContinue}
        isNextDisabled={!selected}
      />
    </div>
  );
}
