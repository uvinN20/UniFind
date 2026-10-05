import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ItemCard from '../components/ItemCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { Empty, ErrorMessage, Loading } from '../components/Feedback.jsx';
import { useFetch } from '../hooks/useFetch';
import { CATEGORIES, ITEM_STATUS, qs } from '../utils';

export default function Items() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const page = parseInt(params.get('page'), 10) || 1;

  const [qInput, setQInput] = useState(q);
  useEffect(() => setQInput(q), [q]);

  const { data, loading, error } = useFetch(`/items${qs({ q, type, category, status, page, limit: 12 })}`);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const clear = () => {
    setParams({});
    setQInput('');
  };

  return (
    <div className="container page">
      <h1>Browse reports</h1>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: qInput.trim() });
        }}
        role="search"
      >
        <div className="field grow">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Title, description, or place"
          />
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={(e) => update({ type: e.target.value })}>
            <option value="">Lost and found</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">Any active status</option>
            {Object.entries(ITEM_STATUS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-dark" type="submit">
          Search
        </button>
        <button className="btn btn-ghost" type="button" onClick={clear}>
          Clear filters
        </button>
      </form>

      {loading && <Loading />}
      <ErrorMessage>{error}</ErrorMessage>

      {data && (
        <>
          <p className="result-count">
            {data.total} {data.total === 1 ? 'report' : 'reports'} found
          </p>
          {data.items.length === 0 ? (
            <Empty title="Nothing matches yet">
              Try fewer words or clear the filters. You can also report the item so others can find it.
            </Empty>
          ) : (
            <div className="grid">
              {data.items.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
          <Pagination page={data.page} pages={data.pages} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
