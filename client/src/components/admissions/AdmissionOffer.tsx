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
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-white">
            <Ticket className="h-5 w-5 text-cyan-200" />
            Admission & passes
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Tickets for fans and guests are separate from competitor
            registration.
          </p>
        </div>
        {sandbox ? (
          <button
            className="min-h-11 rounded-full bg-cyan-300 px-6 font-bold text-slate-950"
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Close ticket preview" : "Preview ticket options"}
          </button>
        ) : (
          <Link
            href={`/admissions/${encodeURIComponent(eventKey)}`}
            className="inline-flex min-h-11 items-center rounded-full bg-cyan-300 px-6 font-bold text-slate-950 hover:bg-cyan-200"
          >
            View tickets
          </Link>
        )}
      </section>
      {sandbox && preview && <AdmissionPage eventKey={eventKey} />}
    </>
  );
}
