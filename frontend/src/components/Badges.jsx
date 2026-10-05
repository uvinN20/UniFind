import { CLAIM_STATUS, ITEM_STATUS } from '../utils';

export const TypeBadge = ({ type }) => (
  <span className={`badge badge-${type}`}>{type === 'lost' ? 'Lost' : 'Found'}</span>
);

export const StatusBadge = ({ status }) => {
  const s = ITEM_STATUS[status] || { label: status, tone: 'closed' };
  return <span className={`pill pill-${s.tone}`}>{s.label}</span>;
};

export const ClaimBadge = ({ status }) => {
  const s = CLAIM_STATUS[status] || { label: status, tone: 'closed' };
  return <span className={`pill pill-${s.tone}`}>{s.label}</span>;
};
