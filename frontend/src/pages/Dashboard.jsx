import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../components/Toast.jsx';
import { ClaimBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import { Empty, ErrorMessage, Loading } from '../components/Feedback.jsx';
import { formatDate } from '../utils';

function MyReports() {
  const { data, loading, error } = useFetch('/items/mine');
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (data.items.length === 0) {
    return (
      <Empty title="You have not reported anything yet">
        <Link to="/report">Report a lost or found item</Link> and it will show up here with its recovery status.
      </Empty>
    );
  }
  return (
    <ul className="rows">
      {data.items.map((item) => (
        <li key={item._id} className="row">
          <div className="row-main">
            <div className="tag-badges">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
              {item.pendingClaims > 0 && <span className="pill pill-pending">{item.pendingClaims} to review</span>}
            </div>
            <Link to={`/items/${item._id}`} className="row-title">
              {item.title}
            </Link>
            <p className="muted">
              {item.location}, {formatDate(item.dateOccurred)}
            </p>
          </div>
          <Link to={`/items/${item._id}/edit`} className="btn btn-ghost btn-sm">
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MyClaims() {
  const { data, loading, error, reload } = useFetch('/claims/mine');
  const toast = useToast();
  const [actionError, setActionError] = useState('');

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this claim?')) return;
    try {
      await api.patch(`/claims/${id}/withdraw`);
      toast('Claim withdrawn');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (data.claims.length === 0) {
    return (
      <Empty title="No claims yet">
        Found a report that matches? <Link to="/items">Browse reports</Link> and send a claim.
      </Empty>
    );
  }
  return (
    <>
      <ErrorMessage>{actionError}</ErrorMessage>
      <ul className="rows">
        {data.claims.map((claim) => (
          <li key={claim._id} className="row">
            <div className="row-main">
              <div className="tag-badges">
                {claim.item && <TypeBadge type={claim.item.type} />}
                <ClaimBadge status={claim.status} />
              </div>
              {claim.item ? (
                <Link to={`/items/${claim.item._id}`} className="row-title">
                  {claim.item.title}
                </Link>
              ) : (
                <span className="row-title">Report removed</span>
              )}
              <p className="muted">Sent {formatDate(claim.createdAt)}</p>
              {claim.reviewNote && <p>Note: {claim.reviewNote}</p>}
              {claim.contact && (
                <p className="contact-inline">
                  Contact {claim.contact.name}: <a href={`mailto:${claim.contact.email}`}>{claim.contact.email}</a>
                  {claim.contact.phone && `, ${claim.contact.phone}`}
                </p>
              )}
            </div>
            {claim.status === 'pending' && (
              <button className="btn btn-ghost btn-sm" onClick={() => withdraw(claim._id)}>
                Withdraw
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function ReceivedClaims() {
  const { data, loading, error, reload } = useFetch('/claims/received');
  const toast = useToast();
  const [notes, setNotes] = useState({});
  const [actionError, setActionError] = useState('');

  const review = async (id, decision) => {
    setActionError('');
    try {
      await api.patch(`/claims/${id}/review`, { decision, note: notes[id] || '' });
      toast(decision === 'approved' ? 'Claim approved. The item is marked as recovered.' : 'Claim rejected');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (data.claims.length === 0) {
    return <Empty title="No claims on your reports">When someone sends a claim, you can review it here.</Empty>;
  }
  return (
    <>
      <ErrorMessage>{actionError}</ErrorMessage>
      <ul className="rows">
        {data.claims.map((claim) => (
          <li key={claim._id} className="row row-stack">
            <div className="row-main">
              <div className="tag-badges">
                <ClaimBadge status={claim.status} />
              </div>
              <Link to={`/items/${claim.item._id}`} className="row-title">
                {claim.item.title}
              </Link>
              <p className="muted">
                From {claim.claimant.name}
                {claim.claimant.studentId && ` (${claim.claimant.studentId})`} on {formatDate(claim.createdAt)}
              </p>
              <p>{claim.message}</p>
              {claim.proofDetails && <p className="proof">{claim.proofDetails}</p>}
              <p className="muted">
                {claim.claimant.email}
                {(claim.contactPhone || claim.claimant.phone) && `, ${claim.contactPhone || claim.claimant.phone}`}
              </p>
              {claim.reviewNote && <p>Your note: {claim.reviewNote}</p>}
            </div>
            {claim.status === 'pending' && (
              <div className="review">
                <label htmlFor={`note-${claim._id}`} className="sr-only">
                  Note to the claimant
                </label>
                <input
                  id={`note-${claim._id}`}
                  placeholder="Add a note (optional)"
                  maxLength={300}
                  value={notes[claim._id] || ''}
                  onChange={(e) => setNotes({ ...notes, [claim._id]: e.target.value })}
                />
                <button className="btn btn-dark btn-sm" onClick={() => review(claim._id, 'approved')}>
                  Approve
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => review(claim._id, 'rejected')}>
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

const TABS = [
  ['reports', 'My reports'],
  ['claims', 'My claims'],
  ['received', 'Claims on my reports'],
];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('reports');

  return (
    <div className="container page">
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <div className="tabs" role="tablist" aria-label="Dashboard sections">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'reports' && <MyReports />}
        {tab === 'claims' && <MyClaims />}
        {tab === 'received' && <ReceivedClaims />}
      </div>
    </div>
  );
}
