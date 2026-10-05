import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, imageSrc } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../components/Toast.jsx';
import { ClaimBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import StatusTracker from '../components/StatusTracker.jsx';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';
import { formatDate } from '../utils';

// Wording changes depending on whether the report is for a lost or a found item
const COPY = {
  found: {
    title: 'Is this yours?',
    intro: 'Describe the item so the finder can check it is really yours.',
    message: 'How can you show it is yours?',
    proof: 'Details only the owner would know',
    submit: 'Send claim',
  },
  lost: {
    title: 'Did you find this?',
    intro: 'Tell the owner where the item is and how they can get it back.',
    message: 'Where did you find it?',
    proof: 'Where is it now?',
    submit: 'Tell the owner',
  },
};

function ClaimForm({ item, onDone }) {
  const copy = COPY[item.type];
  const toast = useToast();
  const [form, setForm] = useState({ message: '', proofDetails: '', contactPhone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post(`/claims/item/${item._id}`, form);
      toast('Your claim was sent');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{copy.title}</h2>
      <p>{copy.intro}</p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="field">
        <label htmlFor="c-message">{copy.message}</label>
        <textarea id="c-message" required rows={3} maxLength={500} value={form.message} onChange={set('message')} />
      </div>
      <div className="field">
        <label htmlFor="c-proof">{copy.proof}</label>
        <textarea id="c-proof" rows={3} maxLength={500} value={form.proofDetails} onChange={set('proofDetails')} />
      </div>
      <div className="field">
        <label htmlFor="c-phone">Your phone (optional)</label>
        <input id="c-phone" type="tel" value={form.contactPhone} onChange={set('contactPhone')} />
      </div>
      <button className="btn btn-dark" disabled={busy}>
        {busy ? 'Sending' : copy.submit}
      </button>
    </form>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(`/items/${id}`);
  const [actionError, setActionError] = useState('');

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="container page narrow">
        <ErrorMessage>{error}</ErrorMessage>
        <Link to="/items" className="btn btn-ghost">
          Back to reports
        </Link>
      </div>
    );
  }

  const { item, myClaim, isOwner } = data;
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;
  const isActive = ['open', 'claim_pending'].includes(item.status);
  const canClaim = user && !isOwner && isActive && myClaim?.status !== 'pending';
  const src = imageSrc(item.imageUrl);

  const setStatus = async (status, message) => {
    setActionError('');
    try {
      await api.patch(`/items/${item._id}/status`, { status });
      toast(message);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this report and all of its claims? This cannot be undone.')) return;
    try {
      await api.del(`/items/${item._id}`);
      toast('Report deleted');
      navigate(isOwner ? '/dashboard' : '/items');
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="container page">
      <Link to="/items" className="back-link">
        Back to reports
      </Link>

      <div className="detail">
        <div className="detail-main">
          <div className={`detail-photo tag-${item.type}`}>
            {src ? <img src={src} alt={`Photo of ${item.title}`} /> : <span aria-hidden="true">{item.category.charAt(0)}</span>}
          </div>
        </div>

        <div className="detail-side">
          <div className="tag-badges">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
          </div>
          <h1>{item.title}</h1>

          <StatusTracker status={item.status} />

          <dl className="facts">
            <div>
              <dt>{item.type === 'lost' ? 'Lost at' : 'Found at'}</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <dt>{item.type === 'lost' ? 'Date lost' : 'Date found'}</dt>
              <dd>{formatDate(item.dateOccurred)}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{item.category}</dd>
            </div>
            <div>
              <dt>Reported by</dt>
              <dd>{item.reporter.name}</dd>
            </div>
          </dl>

          <p className="description">{item.description}</p>

          {item.contact && (
            <div className="contact-box">
              <h2>Contact details</h2>
              <p>
                <a href={`mailto:${item.contact.email}`}>{item.contact.email}</a>
              </p>
              {item.contact.phone && <p>{item.contact.phone}</p>}
            </div>
          )}

          <ErrorMessage>{actionError}</ErrorMessage>

          {canManage && (
            <div className="actions">
              <Link to={`/items/${item._id}/edit`} className="btn btn-ghost btn-sm">
                Edit report
              </Link>
              {isActive && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus('recovered', 'Marked as recovered')}>
                    Mark as recovered
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus('closed', 'Report closed')}>
                    Close report
                  </button>
                </>
              )}
              {!isActive && (
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus('open', 'Report reopened')}>
                  Reopen report
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={remove}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOwner && myClaim && (
        <section className="card claim-status">
          <h2>Your claim</h2>
          <p>
            <ClaimBadge status={myClaim.status} />
          </p>
          {myClaim.reviewNote && <p>Note from the reviewer: {myClaim.reviewNote}</p>}
          {myClaim.status === 'approved' && <p>Your claim was approved. Use the contact details above to arrange the hand-over.</p>}
        </section>
      )}

      {canClaim && <ClaimForm item={item} onDone={reload} />}

      {!user && isActive && (
        <section className="card">
          <h2>{COPY[item.type].title}</h2>
          <p>Log in to send a claim on this report.</p>
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-dark">
            Log in to continue
          </Link>
        </section>
      )}
    </div>
  );
}
