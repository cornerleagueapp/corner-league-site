export default function LoadingCards({
  label = "Loading content…",
  count = 6,
}: {
  label?: string;
  count?: number;
}) {
  return (
    <div className="cl-loading-cards" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="cl-loading-grid" aria-hidden="true">
        {Array.from({ length: Math.min(6, Math.max(1, count)) }, (_, i) => (
          <div className="cl-loading-card" key={i}>
            <div className="cl-skeleton cl-skeleton-photo" />
            <div className="cl-loading-body">
              <div className="cl-skeleton cl-skeleton-line" />
              <div className="cl-skeleton cl-skeleton-line cl-skeleton-short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
