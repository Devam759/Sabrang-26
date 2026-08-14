interface PaginationProps {
  count: number;
  activeIndex: number;
  loading: boolean;
  onSelect: (index: number) => void;
}

// Dots centred below the strip; the active dot gains a thin white ring.
// While loading, the whole row is replaced by an inline loading state.
export default function Pagination({
  count,
  activeIndex,
  loading,
  onSelect,
}: PaginationProps) {
  // The dot row is replaced, not accompanied — the control strip keeps one
  // job at a time so nothing shifts position when the state flips.
  if (loading) {
    return (
      <div className="fsc-pagination fsc-loading" role="status">
        <span className="fsc-spinner" aria-hidden="true" />
        Loading
      </div>
    );
  }
  return (
    <div className="fsc-pagination" role="tablist" aria-label="Pages">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          aria-label={`Go to item ${i + 1}`}
          className={`fsc-dot${i === activeIndex ? ' fsc-dot-active' : ''}`}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
