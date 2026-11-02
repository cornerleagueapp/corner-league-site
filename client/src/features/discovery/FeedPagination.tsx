export default function FeedPagination({
  page,
  count,
  hasNext,
  busy,
  onPage,
  atLimit = false,
  totalItems,
  totalPages,
  partial = false,
}: {
  atLimit?: boolean;
  totalItems?: number | null;
  totalPages?: number | null;
  partial?: boolean;
  page: number;
  count: number;
  hasNext: boolean;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <nav
      className="discovery-feed-pagination"
      aria-label="Latest updates pages"
    >
      <p role="status" aria-live="polite">
        Page {page + 1}
        {totalPages && totalPages > 0 ? ` of ${totalPages}` : ""} ·{" "}
        {Number.isSafeInteger(totalItems) && totalItems! >= 0
          ? `${page * 12 + 1}–${page * 12 + count} of ${totalItems} updates`
          : `${count} ${count === 1 ? "update" : "updates"}`}
      </p>
      <div>
        <button
          type="button"
          disabled={page === 0 || busy}
          onClick={() => onPage(page - 1)}
        >
          ← Previous
        </button>
        <span aria-current="page">{page + 1}</span>
        <button
          type="button"
          disabled={!hasNext || busy}
          onClick={() => onPage(page + 1)}
        >
          {busy ? "Loading…" : "Next →"}
        </button>
      </div>
      {!hasNext && count > 0 && (
        <small>
          {partial
            ? "Some discovery articles are temporarily unavailable. Refresh to check again."
            : atLimit
              ? "You’ve reached the browsing limit. Refresh for the latest updates."
              : "End of the currently available updates."}
        </small>
      )}
    </nav>
  );
}
