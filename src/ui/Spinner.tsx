/** className hook: .spinner (.spinner--block for a centered block). */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label || undefined} aria-hidden={label ? undefined : true} />;
}

export function PageSpinner() {
  return (
    <div className="spinner--block">
      <Spinner />
    </div>
  );
}
