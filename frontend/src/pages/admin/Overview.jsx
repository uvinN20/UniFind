import { useFetch } from '../../hooks/useFetch';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';

export default function Overview() {
  const { data, loading, error } = useFetch('/admin/stats');
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  const tiles = [
    ['Registered users', data.users],
    ['Lost reports', data.lost],
    ['Found reports', data.found],
    ['Open reports', data.open],
    ['Recovered items', data.recovered],
    ['Claims waiting for review', data.pendingClaims],
    ['Claims in total', data.totalClaims],
  ];

  return (
    <dl className="stat-grid">
      {tiles.map(([label, value]) => (
        <div key={label} className="stat">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
