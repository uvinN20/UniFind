export const CATEGORIES = [
  'Electronics',
  'Books & Stationery',
  'ID & Cards',
  'Keys',
  'Clothing & Bags',
  'Wallets & Money',
  'Other',
];

export const ITEM_STATUS = {
  open: { label: 'Still open', tone: 'open' },
  claim_pending: { label: 'Claim under review', tone: 'pending' },
  recovered: { label: 'Recovered', tone: 'done' },
  closed: { label: 'Closed', tone: 'closed' },
};

export const CLAIM_STATUS = {
  pending: { label: 'Waiting for review', tone: 'pending' },
  approved: { label: 'Approved', tone: 'done' },
  rejected: { label: 'Rejected', tone: 'rejected' },
  withdrawn: { label: 'Withdrawn', tone: 'closed' },
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Builds "?a=1&b=2" and skips empty values
export const qs = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const text = params.toString();
  return text ? `?${text}` : '';
};
