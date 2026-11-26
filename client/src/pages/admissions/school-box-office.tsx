import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import cornerLeagueLogo from "@assets/CL_Logo.png";
import { admissionData, admissionKey } from "@/lib/admissions";
import "./guest-admissions.css";

type BoxOffice = {
  organizationName: string;
  events: {
    key: string;
    name: string;
    location: string;
    startsAt: string;
    options: { name: string; free: boolean }[];
  }[];
};

export default function SchoolBoxOffice({ org }: { org: string }) {
  const [search, setSearch] = useState("");
  const [price, setPrice] = useState("all");
  const [date, setDate] = useState("");
  const office = useQuery({
    queryKey: ["school-box-office", org],
    queryFn: () =>
      admissionData<BoxOffice>(
        "/admissions/box-office/" + encodeURIComponent(org),
      ),
    retry: false,
  });
  const events = office.data?.events.flatMap((event) => {
    const start = new Date(event.startsAt);
    const day = [
      start.getFullYear(),
      String(start.getMonth() + 1).padStart(2, "0"),
      String(start.getDate()).padStart(2, "0"),
    ].join("-");
    if (date && date !== day) return [];
    const term = search.trim().toLowerCase();
    const eventMatch = [event.name, event.location].some((v) =>
      v?.toLowerCase().includes(term),
    );
    const options = event.options.filter(
      (ticket) =>
        (price === "all" || ticket.free === (price === "free")) &&
        (eventMatch || ticket.name.toLowerCase().includes(term)),
    );
    return options.length ? [{ ...event, options }] : [];
  });
  return (
    <main className="cl-box-office">
      <div className="cl-box-office__masthead">
        <div className="cl-box-office__wrap cl-box-office__masthead-inner">
          <div className="cl-box-office__identity">
            <img
              src={cornerLeagueLogo}
              alt=""
              width={48}
              height={48}
              style={{ objectFit: "contain" }}
            />
            <span>
              {office.data?.organizationName || "Corner League"}
              <small>ATHLETICS BOX OFFICE</small>
            </span>
          </div>
          <span className="cl-box-office__powered">
            Powered by <strong>Corner League</strong>
          </span>
        </div>
      </div>
      <header className="cl-box-office__hero">
        <div className="cl-box-office__wrap cl-box-office__hero-inner">
          <div>
            <h1>Upcoming event tickets</h1>
            <p className="cl-box-office__hero-note">
              Find your next game and choose your passes.
            </p>
          </div>
        </div>
      </header>
      <section
        className="cl-box-office__wrap cl-box-office__content"
        aria-labelledby="box-office-schedule"
      >
        <div>
          <h2 id="box-office-schedule">Ticket schedule</h2>
        </div>
        <div
          className="cl-box-office__fields"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
            marginTop: 20,
          }}
        >
          <label>
            Search games or ticket names
            <input
              type="search"
              placeholder="Team, venue, VIP, general admission…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Price
            <select value={price} onChange={(e) => setPrice(e.target.value)}>
              <option value="all">All tickets</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
        {office.isPending && (
          <p className="cl-box-office__notice" role="status">
            Loading events…
          </p>
        )}
        {office.isError && (
          <div className="cl-box-office__notice" role="alert">
            <p>We couldn’t load this box office.</p>
            <button
              type="button"
              className="cl-box-office__button"
              onClick={() => void office.refetch()}
            >
              Try again
            </button>
          </div>
        )}
        {events?.length === 0 && (
          <p className="cl-box-office__notice" role="status">
            No upcoming ticketed events match these filters.
          </p>
        )}
        <div className="cl-box-office__grid">
          {events?.map((event) => (
            <article className="cl-box-office__ticket" key={event.key}>
              <div className="cl-box-office__ticket-top">
                <time dateTime={event.startsAt}>
                  {new Date(event.startsAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <div className="cl-box-office__ticket-body">
                <h3>{event.name}</h3>
                <p>{event.location}</p>
                <p>{event.options.map((option) => option.name).join(" · ")}</p>
                {event.options.some((option) => !option.free) && (
                  <a
                    className="cl-box-office__button"
                    href={"/buy-tickets/" + admissionKey(event.key)}
                  >
                    Buy tickets as a guest
                  </a>
                )}
                {event.options.some((option) => option.free) && (
                  <a
                    className="cl-box-office__button"
                    href={"/admissions/" + admissionKey(event.key)}
                  >
                    View free passes on Corner League
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
