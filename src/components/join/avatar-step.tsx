import type { JoinError } from "@/app/[lang]/[slug]/actions";
import { GuestAvatar } from "@/components/guest-avatar";
import { StepActions } from "@/components/join/step-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import { avatarRefs, avatarSets } from "@/lib/avatars";
import { cn } from "@/lib/utils";

type Props = {
  selected: string | null;
  onSelect: (avatar: string) => void;
  onBack: () => void;
  onEnter: () => void;
  isJoining: boolean;
  error: JoinError | null;
  dict: Dictionary["join"];
};

export function AvatarStep({
  selected,
  onSelect,
  onBack,
  onEnter,
  isJoining,
  error,
  dict,
}: Props) {
  return (
    <div className="flex flex-1 flex-col duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-center">
        <p
          data-slot="eyebrow"
          className="mb-2 text-xs font-medium text-muted-foreground"
        >
          {dict.avatarEyebrow}
        </p>
        <h1
          data-slot="page-title"
          className="font-heading text-3xl leading-tight tracking-tight"
        >
          {dict.avatarTitle}
        </h1>
      </div>

      <Tabs defaultValue={avatarSets[0]} className="mt-6 gap-5">
        <TabsList className="w-full">
          {avatarSets.map((set) => (
            <TabsTrigger key={set} value={set}>
              {dict.avatarSets[set]}
            </TabsTrigger>
          ))}
        </TabsList>
        {avatarSets.map((set) => (
          <TabsContent
            key={set}
            value={set}
            className="grid grid-cols-4 gap-x-4 gap-y-5"
          >
            {avatarRefs(set).map((avatar, index) => (
              <button
                key={avatar}
                type="button"
                aria-label={format(dict.chooseAvatar, { number: index + 1 })}
                aria-pressed={avatar === selected}
                onClick={() => onSelect(avatar)}
                className={cn(
                  "aspect-square rounded-full p-0.5 transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95",
                  avatar === selected &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <GuestAvatar avatar={avatar} className="size-full" />
              </button>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-destructive">
          {dict.errors[error]}
        </p>
      )}

      <StepActions
        backLabel={dict.back}
        nextLabel={dict.enter}
        pendingLabel={dict.entering}
        onBack={onBack}
        onNext={onEnter}
        isNextDisabled={!selected}
        isPending={isJoining}
      />
    </div>
  );
}
