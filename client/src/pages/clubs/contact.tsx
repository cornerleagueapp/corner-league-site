import { useRef, useState } from "react";
import { Link } from "wouter";
import { MessageCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import PublicTopNav from "@/components/navigation/PublicTopNav";
import SiteFooter from "@/components/SiteFooter";
import { PageSEO } from "@/seo/usePageSEO";
import {
  ContactInput,
  contactRequestId,
  sendContact,
} from "@/lib/supportContact";
const empty: ContactInput = {
  name: "",
  email: "",
  title: "",
  message: "",
  category: "general_inquiry",
  website: "",
};
export default function ContactPage() {
  const [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ticket, setTicket] = useState("");
  const writing = useRef(false),
    pending = useRef({ signature: "", id: "" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    const input = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      title: form.title.trim(),
      message: form.message.trim(),
    };
    const signature = JSON.stringify(input);
    if (pending.current.signature !== signature)
      pending.current = { signature, id: contactRequestId() };
    try {
      const receipt = await sendContact(input, pending.current.id);
      setTicket(receipt.ticketId);
      setForm(empty);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  function field(key: keyof ContactInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const inputClass =
    "mt-2 w-full min-h-12 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-60";
  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <PageSEO
        title="Contact & Support | Corner League"
        description="Get help with your Corner League account, share feedback, or contact our team about your organization."
      />
      <PublicTopNav />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">
            LET’S TALK
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            How can we help?
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
            Questions, feedback or a little help getting started. Send our team
            a message and we’ll review your request.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-6">
              <MessageCircle className="mb-4 h-7 w-7 text-cyan-300" />
              <h2 className="text-xl font-bold">Fans & athletes</h2>
              <p className="mt-3 leading-7 text-slate-300">
                Need help with your account, athlete profile or the platform?
                Use the form. For event rules or schedule changes, contact the
                event organizer.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 p-6">
              <h2 className="text-xl font-bold">Organization support</h2>
              <p className="mt-3 leading-7 text-slate-300">
                Already managing an organization? Sign in to Corner League OS
                and open Contact & Support for priority help linked to your
                workspace.
              </p>
              <a
                href="https://admin.cornerleague.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-cyan-200"
              >
                Open organization support
                <ArrowUpRight size={18} />
              </a>
            </div>
            <p className="px-1 text-sm leading-6 text-slate-400">
              Please don’t include passwords or payment card details. Our team
              can use the ticket reference to locate your request.
            </p>
          </aside>
          <section className="rounded-3xl border border-white/15 bg-[#081524] p-6 sm:p-8">
            {ticket ? (
              <div role="status" className="space-y-5">
                <CheckCircle2 className="h-10 w-10 text-cyan-300" />
                <h2 className="text-2xl font-bold">Your request is received</h2>
                <p className="text-slate-300">
                  It’s in our support queue. Keep this reference for any
                  follow-up.
                </p>
                <p className="break-all rounded-xl bg-white/5 p-4 font-mono text-sm">
                  {ticket}
                </p>
                <button
                  className="min-h-11 font-bold text-cyan-200"
                  onClick={() => {
                    setTicket("");
                    pending.current = { signature: "", id: "" };
                  }}
                >
                  Send another request
                </button>
                <Link
                  href="/"
                  className="ml-4 inline-block min-h-11 text-slate-300"
                >
                  Back to sports
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <h2 className="text-2xl font-bold">Send a message</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label htmlFor="contact-name">
                    Your name
                    <input
                      id="contact-name"
                      className={inputClass}
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={form.name}
                      disabled={busy}
                      onChange={(e) => field("name", e.target.value)}
                    />
                  </label>
                  <label htmlFor="contact-email">
                    Reply email
                    <input
                      id="contact-email"
                      className={inputClass}
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      value={form.email}
                      disabled={busy}
                      onChange={(e) => field("email", e.target.value)}
                    />
                  </label>
                </div>
                <label htmlFor="contact-category" className="block">
                  What’s this about?
                  <select
                    id="contact-category"
                    className={inputClass}
                    value={form.category}
                    disabled={busy}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {[
                      ["general_inquiry", "General question"],
                      ["bug", "Something isn’t working"],
                      ["feature_request", "Feedback or feature idea"],
                      ["other", "Something else"],
                    ].map(([value, label]) => (
                      <option
                        className="bg-[#081524]"
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="contact-title" className="block">
                  Subject
                  <input
                    id="contact-title"
                    className={inputClass}
                    required
                    minLength={3}
                    maxLength={200}
                    value={form.title}
                    disabled={busy}
                    onChange={(e) => field("title", e.target.value)}
                  />
                </label>
                <label htmlFor="contact-message" className="block">
                  Message
                  <textarea
                    id="contact-message"
                    className={inputClass}
                    rows={7}
                    required
                    minLength={10}
                    maxLength={4000}
                    value={form.message}
                    disabled={busy}
                    onChange={(e) => field("message", e.target.value)}
                  />
                </label>
                <div hidden aria-hidden="true">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => field("website", e.target.value)}
                    />
                  </label>
                </div>
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-400/30 p-4 text-rose-200"
                  >
                    {error}
                  </p>
                )}
                <button
                  disabled={busy}
                  className="min-h-12 w-full rounded-xl bg-cyan-300 px-5 py-3 font-bold text-[#030913] disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send request"}
                </button>
                <p className="text-xs leading-6 text-slate-400">
                  Your details are used to handle this request.{" "}
                  <Link href="/terms" className="underline">
                    Terms & privacy
                  </Link>
                </p>
              </form>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
