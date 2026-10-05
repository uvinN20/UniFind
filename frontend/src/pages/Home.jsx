import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ItemCard from '../components/ItemCard.jsx';
import { Empty, ErrorMessage, Loading } from '../components/Feedback.jsx';
import { useFetch } from '../hooks/useFetch';
import { qs } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const recent = useFetch('/items?limit=6');
  const stats = useFetch('/items/stats/summary');

  const submit = (e) => {
    e.preventDefault();
    navigate(`/items${qs({ q: q.trim(), type })}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Lost it on campus? Someone may have already found it.</h1>
            <p className="lead">
              UniFind is where students report lost and found items, search what others have handed in, and claim
              belongings back.
            </p>
            <div className="hero-actions">
              <Link to="/report?type=lost" className="btn btn-primary">
                I lost something
              </Link>
              <Link to="/report?type=found" className="btn btn-ghost">
                I found something
              </Link>
            </div>
          </div>

          <form className="ticket" onSubmit={submit} role="search">
            <label htmlFor="home-q" className="ticket-title">
              What are you looking for?
            </label>
            <input
              id="home-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Blue water bottle, student ID, keys"
            />
            <fieldset className="segmented">
              <legend className="sr-only">Show reports</legend>
              {[
                ['', 'All reports'],
                ['lost', 'Lost'],
                ['found', 'Found'],
              ].map(([value, label]) => (
                <label key={value || 'all'} className={type === value ? 'is-active' : ''}>
                  <input type="radio" name="home-type" checked={type === value} onChange={() => setType(value)} />
                  {label}
                </label>
              ))}
            </fieldset>
            <button className="btn btn-dark" type="submit">
              Search reports
            </button>
            {stats.data && (
              <dl className="ticket-stats">
                <div>
                  <dt>Reported</dt>
                  <dd>{stats.data.total}</dd>
                </div>
                <div>
                  <dt>Still open</dt>
                  <dd>{stats.data.open}</dd>
                </div>
                <div>
                  <dt>Recovered</dt>
                  <dd>{stats.data.recovered}</dd>
                </div>
              </dl>
            )}
          </form>
        </div>
      </section>

      <section className="container page">
        <div className="section-head">
          <h2>Latest reports</h2>
          <Link to="/items">Browse all reports</Link>
        </div>
        {recent.loading && <Loading />}
        <ErrorMessage>{recent.error}</ErrorMessage>
        {recent.data && recent.data.items.length === 0 && (
          <Empty title="No reports yet">Be the first to report a lost or found item.</Empty>
        )}
        {recent.data && recent.data.items.length > 0 && (
          <div className="grid">
            {recent.data.items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="steps-band">
        <div className="container">
          <h2>How getting an item back works</h2>
          <ol className="steps">
            <li>
              <h3>Report it</h3>
              <p>Add what it looks like, where and when it went missing or turned up, and an optional photo.</p>
            </li>
            <li>
              <h3>Search and match</h3>
              <p>Browse reports from other students. Filter by category, type, or status to narrow it down.</p>
            </li>
            <li>
              <h3>Claim and recover</h3>
              <p>Submit a claim with details only the owner would know. Once it is approved you get contact details.</p>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
