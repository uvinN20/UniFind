import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/Toast.jsx';
import { Empty, ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { formatDate, qs } from '../../utils';

export default function UsersTab() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const { data, loading, error, reload } = useFetch(`/admin/users${qs({ q: search })}`);

  const patch = async (id, body, message) => {
    setActionError('');
    try {
      await api.patch(`/admin/users/${id}`, body);
      toast(message);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Their reports and claims will be deleted too.`)) return;
    setActionError('');
    try {
      await api.del(`/admin/users/${u._id}`);
      toast('User deleted');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
        role="search"
      >
        <div className="field grow">
          <label htmlFor="user-q">Search users</label>
          <input id="user-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or student ID" />
        </div>
        <button className="btn btn-dark">Search</button>
      </form>

      <ErrorMessage>{error || actionError}</ErrorMessage>
      {loading && <Loading />}
      {data && data.users.length === 0 && <Empty title="No users found" />}
      {data && data.users.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const self = u._id === me._id;
                return (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.studentId || '-'}</td>
                    <td>{u.role === 'admin' ? 'Admin' : 'Student'}</td>
                    <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="cell-actions">
                      {self ? (
                        <span className="muted">You</span>
                      ) : (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => patch(u._id, { role: u.role === 'admin' ? 'student' : 'admin' }, 'Role updated')}
                          >
                            {u.role === 'admin' ? 'Make student' : 'Make admin'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => patch(u._id, { isActive: !u.isActive }, u.isActive ? 'User deactivated' : 'User activated')}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
