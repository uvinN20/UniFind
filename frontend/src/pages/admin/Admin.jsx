import { useState } from 'react';
import Overview from './Overview.jsx';
import UsersTab from './UsersTab.jsx';
import ItemsTab from './ItemsTab.jsx';
import ClaimsTab from './ClaimsTab.jsx';

const TABS = [
  ['overview', 'Overview', Overview],
  ['users', 'Users', UsersTab],
  ['items', 'Reports', ItemsTab],
  ['claims', 'Claims', ClaimsTab],
];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const Active = TABS.find(([key]) => key === tab)[2];

  return (
    <div className="container page">
      <h1>Admin</h1>
      <div className="tabs" role="tablist" aria-label="Admin sections">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <Active />
      </div>
    </div>
  );
}
