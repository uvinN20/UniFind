import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/Toast.jsx';
import { StatusBadge, TypeBadge } from '../../components/Badges.jsx';
import Pagination from '../../components/Pagination.jsx';
import { Empty, ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { ITEM_STATUS, formatDate, qs } from '../../utils';

export default function ItemsTab() {
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', type: '', status: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const { data, loading, error, reload } = useFetch(`/admin/items${qs({ ...applied, page })}`);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const setStatus = async (id, status) => {
    setActionError('');
    try {
      await api.patch(`/items/${id}/status`, { status });
      toast('Status updated');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}" and its claims?`)) return;
    setActionError('');
    try {
      await api.del(`/items/${item._id}`);
      toast('Report deleted');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <form className="filters" onSubmit={apply} role="search">
        <div className="field grow">
          <label htmlFor="admin-q">Search reports</label>
          <input id="admin-q" type="search" value={filters.q} onChange={set('q')} placeholder="Title, description or place" />
        </div>
        <div className="field">
          <label htmlFor="admin-type">Type</label>
          <select id="admin-type" value={filters.type} onChange={set('type')}>
            <option value="">Lost and found</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="admin-status">Status</label>
          <select id="admin-status" value={filters.status} onChange={set('status')}>
            <option value="">Any status</option>
            {Object.entries(ITEM_STATUS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-dark">Apply</button>
      </form>

      <ErrorMessage>{error || actionError}</ErrorMessage>
      {loading && <Loading />}
      {data && data.items.length === 0 && <Empty title="No reports match these filters" />}
      {data && data.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reported by</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Link to={`/items/${item._id}`}>{item.title}</Link>
                    </td>
                    <td>
                      <TypeBadge type={item.type} />
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.reporter ? item.reporter.name : 'Former user'}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td className="cell-actions">
                      {['open', 'claim_pending'].includes(item.status) ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(item._id, 'closed')}>
                          Close
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(item._id, 'open')}>
                          Reopen
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(item)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
