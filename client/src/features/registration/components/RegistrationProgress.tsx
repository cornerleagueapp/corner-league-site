import {
  Check,
  CreditCard,
  Flag,
  Phone,
  ShipWheel,
  UserRound,
} from "lucide-react";

type RegistrationProgressProps = {
  currentStep: number;
  onStepSelect?: (step: number) => void;
  highestCompletedStep?: number;
};

const steps = [
  {
    number: 1,
    label: "Racer",
    shortLabel: "Racer",
    icon: UserRound,
  },
  {
    number: 2,
    label: "Contact",
    shortLabel: "Contact",
    icon: Phone,
  },
  {
    number: 3,
    label: "Classes",
    shortLabel: "Classes",
    icon: Flag,
  },
  {
    number: 4,
    label: "Watercraft",
    shortLabel: "Boat",
    icon: ShipWheel,
  },
  {
    number: 5,
    label: "Payment",
    shortLabel: "Payment",
    icon: CreditCard,
  },
  {
    number: 6,
    label: "Review",
    shortLabel: "Review",
    icon: Check,
  },
];

export default function RegistrationProgress({
  currentStep,
  onStepSelect,
  highestCompletedStep = 0,
}: RegistrationProgressProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[#07111F]/92 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-4">
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;

            const active = currentStep === step.number;
            const completed =
              step.number < currentStep || step.number <= highestCompletedStep;

            const canSelect =
              typeof onStepSelect === "function" &&
              (completed || step.number === currentStep);

            return (
              <div key={step.number} className="flex items-center">
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => {
                    if (canSelect) {
                      onStepSelect?.(step.number);
                    }
                  }}
                  className={`group flex min-w-[78px] flex-col items-center gap-2 rounded-[18px] px-2 py-2.5 transition sm:min-w-[96px] ${
                    active
                      ? "bg-cyan-300/10"
                      : canSelect
                        ? "hover:bg-white/[0.04]"
                        : "cursor-default"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full border transition ${
                      completed
                        ? "border-emerald-300/25 bg-emerald-300/12 text-emerald-200"
                        : active
                          ? "border-cyan-300/35 bg-cyan-300 text-[#06111d] shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                          : "border-white/10 bg-white/[0.04] text-white/30"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>

                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.12em] ${
                      active
                        ? "text-cyan-100"
                        : completed
                          ? "text-emerald-200/75"
                          : "text-white/35"
                    }`}
                  >
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </button>

                {index < steps.length - 1 ? (
                  <div
                    className={`h-px w-5 shrink-0 sm:w-8 ${
                      step.number < currentStep
                        ? "bg-emerald-300/40"
                        : "bg-white/10"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
