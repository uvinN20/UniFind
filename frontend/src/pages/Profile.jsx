import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast.jsx';
import { ErrorMessage } from '../components/Feedback.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    studentId: user.studentId || '',
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = { name: form.name, studentId: form.studentId, phone: form.phone };
      if (form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }
      const data = await api.put('/auth/me', body);
      updateUser(data.user);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      toast('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page narrow">
      <h1>Your account</h1>
      <form className="card form" onSubmit={submit}>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="field">
          <label htmlFor="p-email">Email</label>
          <input id="p-email" value={user.email} disabled />
        </div>
        <div className="field">
          <label htmlFor="p-name">Full name</label>
          <input id="p-name" required value={form.name} onChange={set('name')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="p-sid">Student ID</label>
            <input id="p-sid" value={form.studentId} onChange={set('studentId')} />
          </div>
          <div className="field">
            <label htmlFor="p-phone">Phone</label>
            <input id="p-phone" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="p-cur">Current password</label>
            <input id="p-cur" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
          </div>
          <div className="field">
            <label htmlFor="p-new">New password</label>
            <input id="p-new" type="password" minLength={6} autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
          </div>
        </div>
        <small>Leave the password fields empty to keep your current password.</small>
        <button className="btn btn-dark" disabled={busy}>
          {busy ? 'Saving' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
