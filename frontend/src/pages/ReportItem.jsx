import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, imageSrc } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../components/Toast.jsx';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';
import { CATEGORIES, todayISO } from '../utils';

function ItemForm({ initial, edit, itemId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const preview = filePreview || (!removeImage ? imageSrc(initial.imageUrl) : null);

  const onFile = (e) => {
    const chosen = e.target.files[0];
    if (chosen && chosen.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB');
      e.target.value = '';
      return;
    }
    setError('');
    setFile(chosen || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      ['type', 'title', 'category', 'description', 'location', 'dateOccurred', 'contactPhone'].forEach((key) =>
        body.append(key, form[key])
      );
      if (file) body.append('image', file);
      if (removeImage && !file) body.append('removeImage', 'true');

      const data = edit
        ? await api.upload(`/items/${itemId}`, body, 'PUT')
        : await api.upload('/items', body);

      toast(edit ? 'Report updated' : 'Report published');
      navigate(`/items/${data.item._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const isLost = form.type === 'lost';

  return (
    <form className="card form" onSubmit={submit}>
      <ErrorMessage>{error}</ErrorMessage>

      <fieldset className="segmented segmented-lg" disabled={edit}>
        <legend className="sr-only">Report type</legend>
        {[
          ['lost', 'I lost something'],
          ['found', 'I found something'],
        ].map(([value, label]) => (
          <label key={value} className={form.type === value ? `is-active is-${value}` : ''}>
            <input type="radio" name="type" checked={form.type === value} onChange={() => setForm({ ...form, type: value })} />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="title">Item name</label>
        <input id="title" required maxLength={100} value={form.title} onChange={set('title')} placeholder="Black Casio calculator" />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          required
          rows={4}
          maxLength={1000}
          value={form.description}
          onChange={set('description')}
          placeholder={
            isLost
              ? 'Colour, brand, marks or stickers. Do not include private details you will use to verify ownership.'
              : 'Describe it without giving away details only the owner would know, such as a lock screen or contents.'
          }
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="location">{isLost ? 'Where did you lose it?' : 'Where did you find it?'}</label>
          <input id="location" required maxLength={120} value={form.location} onChange={set('location')} placeholder="Main library, second floor" />
        </div>
        <div className="field">
          <label htmlFor="dateOccurred">{isLost ? 'Date lost' : 'Date found'}</label>
          <input id="dateOccurred" type="date" required max={todayISO()} value={form.dateOccurred} onChange={set('dateOccurred')} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="contactPhone">Phone for coordinating the hand-over (optional)</label>
        <input id="contactPhone" type="tel" value={form.contactPhone} onChange={set('contactPhone')} />
        <small>Only shared with a person whose claim you approve.</small>
      </div>

      <div className="field">
        <label htmlFor="image">Photo (optional)</label>
        <input id="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} />
        {preview && (
          <div className="preview">
            <img src={preview} alt="Preview of the selected item" />
            {edit && !file && (
              <label className="check">
                <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
                Remove current photo
              </label>
            )}
          </div>
        )}
        {edit && removeImage && !file && <small>The photo will be removed when you save.</small>}
      </div>

      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving' : edit ? 'Save changes' : 'Publish report'}
      </button>
    </form>
  );
}

export default function ReportItem({ edit = false }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const existing = useFetch(edit ? `/items/${id}` : null);

  if (edit && existing.loading) return <Loading />;
  if (edit && existing.error) {
    return (
      <div className="container page narrow">
        <ErrorMessage>{existing.error}</ErrorMessage>
      </div>
    );
  }

  const item = existing.data?.item;
  const initial = item
    ? {
        type: item.type,
        title: item.title,
        category: item.category,
        description: item.description,
        location: item.location,
        dateOccurred: item.dateOccurred.slice(0, 10),
        contactPhone: item.contactPhone || '',
        imageUrl: item.imageUrl,
      }
    : {
        type: params.get('type') === 'found' ? 'found' : 'lost',
        title: '',
        category: 'Other',
        description: '',
        location: '',
        dateOccurred: todayISO(),
        contactPhone: '',
        imageUrl: '',
      };

  return (
    <div className="container page narrow">
      <h1>{edit ? 'Edit report' : 'Report an item'}</h1>
      <ItemForm initial={initial} edit={edit} itemId={id} />
    </div>
  );
}
