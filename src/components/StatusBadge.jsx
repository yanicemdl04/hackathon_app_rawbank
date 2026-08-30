const STATUS_MAP = {
  OK:               { label: 'Approuvée',  cls: 'status-ok' },
  VERIFY:           { label: 'À vérifier', cls: 'status-verify' },
  VERIFIED_BY_USER: { label: 'Vérifiée',   cls: 'status-verified' },
  BLOCK:            { label: 'Bloquée',    cls: 'status-block' },
  FRAUD_CONFIRMED:  { label: 'Fraude',     cls: 'status-block' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: '' }
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>
}
