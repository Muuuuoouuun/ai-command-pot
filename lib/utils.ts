export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : '—';
