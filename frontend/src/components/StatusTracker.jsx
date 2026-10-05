// Shows how far a report has progressed: reported -> claim under review -> recovered
export default function StatusTracker({ status }) {
  if (status === 'closed') {
    return <p className="tracker-closed">This report has been closed and is no longer accepting claims.</p>;
  }

  // Reported is complete as soon as the report exists; a pending claim is the step in progress
  const doneUntil = { open: 0, claim_pending: 0, recovered: 2 }[status] ?? 0;
  const currentIndex = status === 'claim_pending' ? 1 : -1;
  const steps = ['Reported', 'Claim under review', 'Recovered'];

  return (
    <ol className="tracker" aria-label="Recovery progress">
      {steps.map((label, i) => {
        const state = i <= doneUntil ? 'done' : i === currentIndex ? 'current' : 'todo';
        return (
          <li key={label} className={`tracker-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tracker-dot" aria-hidden="true" />
            {label}
          </li>
        );
      })}
    </ol>
  );
}
