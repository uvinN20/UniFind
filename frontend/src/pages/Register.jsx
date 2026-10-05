import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/Feedback.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page narrow">
      <h1>Create your account</h1>
      <form className="card form" onSubmit={submit}>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="email">University email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="studentId">Student ID (optional)</label>
            <input id="studentId" value={form.studentId} onChange={set('studentId')} placeholder="EG/2023/0000" />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
          />
          <small>At least 6 characters.</small>
        </div>
        <button className="btn btn-dark" disabled={busy}>
          {busy ? 'Creating account' : 'Create account'}
        </button>
        <p className="form-note">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
