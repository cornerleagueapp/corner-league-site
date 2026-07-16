import type { ReactNode } from "react";
import { ArrowLeft, Flag, Waves } from "lucide-react";
import { useLocation } from "wouter";
import RegistrationMobileNav from "./RegistrationMobileNav";
import RegistrationSidebar from "./RegistrationSidebar";

type RegistrationLayoutProps = {
  children: ReactNode;

  eyebrow?: string;
  title?: string;
  description?: string;

  actions?: ReactNode;

  backHref?: string;
  backLabel?: string;

  hideHeader?: boolean;
  contentClassName?: string;
};

export default function RegistrationLayout({
  children,
  eyebrow = "Corner League Registration",
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  hideHeader = false,
  contentClassName = "",
}: RegistrationLayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="relative min-h-full w-full overflow-x-hidden bg-[#030913] pt-12 sm:pt-0  pb-10 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-14rem] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.08] blur-[110px]" />

        <div className="absolute right-[-16rem] top-[16rem] h-[38rem] w-[38rem] rounded-full bg-[#FF6B35]/[0.07] blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:64px_64px]" />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/[0.035] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 xl:px-8">
        <RegistrationMobileNav />

        <div className="mt-4 flex min-w-0 items-start gap-5 lg:mt-0 xl:gap-7">
          <RegistrationSidebar />

          <main className="min-w-0 flex-1">
            {!hideHeader ? (
              <header className="relative mb-5 overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-6 lg:rounded-[30px] lg:p-7">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                  <div className="absolute -bottom-28 left-[25%] h-64 w-64 rounded-full bg-[#FF6B35]/8 blur-3xl" />

                  <Waves className="absolute -bottom-8 -right-2 h-40 w-40 text-cyan-300/[0.025]" />
                </div>

                <div className="relative">
                  {backHref ? (
                    <button
                      type="button"
                      onClick={() => navigate(backHref)}
                      className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/65 transition hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {backLabel}
                    </button>
                  ) : null}

                  <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200">
                        <Flag className="h-3.5 w-3.5" />
                        {eyebrow}
                      </div>

                      {title ? (
                        <h1 className="max-w-4xl break-words text-3xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                          {title}
                        </h1>
                      ) : null}

                      {description ? (
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    {actions ? (
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {actions}
                      </div>
                    ) : null}
                  </div>
                </div>
              </header>
            ) : null}

            <div className={`min-w-0 ${contentClassName}`}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
