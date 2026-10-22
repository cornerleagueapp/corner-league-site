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
    <div className="relative min-h-full w-full overflow-x-hidden bg-cl-canvas pb-12 pt-12 text-cl-ink sm:pt-0">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-14rem] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-cl-accent/[0.055] blur-[120px]" />

        <div className="absolute right-[-16rem] top-[18rem] h-[38rem] w-[38rem] rounded-full bg-cl-accent/[0.045] blur-[130px]" />

        <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />

        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-cl-accent/[0.025] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 xl:px-8">
        <RegistrationMobileNav />

        <div className="mt-4 flex min-w-0 items-start gap-5 lg:mt-0 xl:gap-7">
          <RegistrationSidebar />

          <main className="min-w-0 flex-1">
            {!hideHeader ? (
              <header className="relative mb-6 overflow-hidden rounded-[28px] border border-cl-accent/[0.13] bg-cl-canvas p-5 shadow-cl-panel sm:p-6 lg:rounded-[30px] lg:p-7">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cl-accent/[0.075] blur-3xl" />

                  <div className="absolute -bottom-28 left-[25%] h-64 w-64 rounded-full bg-cl-accent/[0.055] blur-3xl" />

                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cl-accent/[0.35] to-transparent" />

                  <Waves className="absolute -bottom-8 -right-2 h-40 w-40 text-cl-accent/[0.06]" />
                </div>

                <div className="relative">
                  {backHref ? (
                    <button
                      type="button"
                      onClick={() => navigate(backHref)}
                      className="mb-5 inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-canvas px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-cl-muted shadow-sm transition hover:border-cl-accent/25 hover:bg-cl-canvas hover:text-cl-ink"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {backLabel}
                    </button>
                  ) : null}

                  <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-canvas px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cl-accent">
                        <Flag className="h-3.5 w-3.5" />
                        {eyebrow}
                      </div>

                      {title ? (
                        <h1 className="max-w-4xl break-words text-3xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-cl-ink sm:text-4xl lg:text-5xl">
                          {title}
                        </h1>
                      ) : null}

                      {description ? (
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-[15px]">
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
