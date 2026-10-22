import { useState } from "react";
import { AdmissionPage } from "@/pages/admissions/admissions";
import { Link } from "wouter";
import { Ticket } from "lucide-react";
export function AdmissionOffer({
  eventKey,
  sandbox = false,
}: {
  eventKey: string;
  sandbox?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cl-accent/20 bg-cl-accent/5 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-cl-ink">
            <Ticket className="h-5 w-5 text-cl-accent" />
            Admission & passes
          </h2>
          <p className="mt-1 text-sm text-cl-muted">
            Tickets for fans and guests are separate from competitor
            registration.
          </p>
        </div>
        {sandbox ? (
          <button
            className="min-h-11 rounded-full bg-cl-accent px-6 font-bold text-cl-contrast"
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Close ticket preview" : "Preview ticket options"}
          </button>
        ) : (
          <Link
            href={`/admissions/${encodeURIComponent(eventKey)}`}
            className="inline-flex min-h-11 items-center rounded-full bg-cl-accent px-6 font-bold text-cl-contrast hover:bg-cl-accent"
          >
            View tickets
          </Link>
        )}
      </section>
      {sandbox && preview && <AdmissionPage eventKey={eventKey} />}
    </>
  );
}
