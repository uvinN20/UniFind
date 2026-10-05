import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/Toast.jsx';
import { ClaimBadge } from '../../components/Badges.jsx';
import { Empty, ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { CLAIM_STATUS, formatDate, qs } from '../../utils';

export default function ClaimsTab() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [actionError, setActionError] = useState('');
  const { data, loading, error, reload } = useFetch(`/admin/claims${qs({ status })}`);

  const review = async (id, decision) => {
    setActionError('');
    try {
      await api.patch(`/claims/${id}/review`, { decision, note: 'Reviewed by an administrator' });
      toast(decision === 'approved' ? 'Claim approved' : 'Claim rejected');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <div className="filters">
        <div className="field">
          <label htmlFor="claim-status">Show claims</label>
          <select id="claim-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(CLAIM_STATUS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ErrorMessage>{error || actionError}</ErrorMessage>
      {loading && <Loading />}
      {data && data.claims.length === 0 && <Empty title="No claims with this status" />}
      {data && data.claims.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Claimant</th>
                <th>Message</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.claims.map((c) => (
                <tr key={c._id}>
                  <td>{c.item ? <Link to={`/items/${c.item._id}`}>{c.item.title}</Link> : 'Removed'}</td>
                  <td>
                    {c.claimant ? c.claimant.name : 'Former user'}
                    {c.claimant && <div className="muted">{c.claimant.email}</div>}
                  </td>
                  <td className="cell-wrap">{c.message}</td>
                  <td>
                    <ClaimBadge status={c.status} />
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td className="cell-actions">
                    {c.status === 'pending' ? (
                      <>
                        <button className="btn btn-dark btn-sm" onClick={() => review(c._id, 'approved')}>
                          Approve
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => review(c._id, 'rejected')}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="muted">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
