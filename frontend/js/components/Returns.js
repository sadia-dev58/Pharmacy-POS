const RETURN_REASONS = [
  'Damaged packaging', 'Wrong medicine dispensed', 'Customer changed mind',
  'Expired medicine', 'Damaged seal', 'Incorrect quantity',
  'Manufacturing defect', 'Customer requested replacement', 'Wrong batch supplied', 'Other',
];

function NewReturnPanel({ onDone }) {
  const [invoiceQuery, setInvoiceQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sale, setSale] = React.useState(null);
  const [selections, setSelections] = React.useState({}); // sale_item_id -> { quantity, reason }
  const [submitting, setSubmitting] = React.useState(false);

  async function findSale(e) {
    e.preventDefault();
    if (!invoiceQuery.trim()) return;
    setSearching(true);
    setError('');
    setSale(null);
    setSelections({});
    try {
      // Sales history search is by invoice number substring - find the matching sale first
      const matches = await api.getSales({});
      const found = matches.find((s) => s.invoice_number.toLowerCase() === invoiceQuery.trim().toLowerCase())
        || matches.find((s) => s.invoice_number.toLowerCase().includes(invoiceQuery.trim().toLowerCase()));
      if (!found) { setError(`No sale found matching "${invoiceQuery}"`); return; }
      const full = await api.getReturnableItems(found.sale_id);
      setSale(full);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  function toggleSelect(item, checked) {
    setSelections((prev) => {
      const next = { ...prev };
      if (checked) next[item.sale_item_id] = { quantity: 1, reason: RETURN_REASONS[0] };
      else delete next[item.sale_item_id];
      return next;
    });
  }

  function updateSelection(saleItemId, field, value) {
    setSelections((prev) => ({ ...prev, [saleItemId]: { ...prev[saleItemId], [field]: value } }));
  }

  const selectedCount = Object.keys(selections).length;
  const estimatedRefund = sale ? sale.items.reduce((sum, it) => {
    const sel = selections[it.sale_item_id];
    if (!sel) return sum;
    return sum + Number(sel.quantity || 0) * Number(it.selling_price);
  }, 0) : 0;

  async function submitReturn() {
    if (selectedCount === 0) { setError('Select at least one item to return'); return; }
    setSubmitting(true);
    setError('');
    try {
      const items = Object.entries(selections).map(([saleItemId, sel]) => ({
        sale_item_id: Number(saleItemId), quantity: Number(sel.quantity), reason: sel.reason,
      }));
      await api.submitReturn({ items });
      setSale(null);
      setSelections({});
      setInvoiceQuery('');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Find a sale to process a return</div>
      <form onSubmit={findSale} className="search-bar" style={{ maxWidth: 420, marginBottom: 4 }}>
        <span className="icon">🔍</span>
        <input placeholder="Enter invoice number, e.g. INV-20260722-1234…" value={invoiceQuery} onChange={(e) => setInvoiceQuery(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={searching}>{searching ? 'Searching…' : 'Find'}</button>
      </form>

      {error && <div className="login-error mt-16">{error}</div>}

      {sale && (
        <div className="mt-16">
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <div>
              <strong className="mono">{sale.invoice_number}</strong>
              <span className="text-muted" style={{ marginLeft: 10, fontSize: 12.5 }}>
                {sale.customer_name || 'Walk-in'} · {new Date(sale.sale_date).toLocaleString()}
              </span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th></th>
                <th>Medicine</th>
                <th>Sold</th>
                <th>Already returned</th>
                <th>Returnable</th>
                <th>Qty to return</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it) => {
                const sel = selections[it.sale_item_id];
                const disabled = it.quantity_returnable <= 0;
                return (
                  <tr key={it.sale_item_id} style={disabled ? { opacity: 0.45 } : {}}>
                    <td>
                      <input type="checkbox" disabled={disabled} checked={!!sel} onChange={(e) => toggleSelect(it, e.target.checked)} />
                    </td>
                    <td>{it.medicine_name}{it.dosage ? ` (${it.dosage})` : ''}</td>
                    <td>{it.quantity_sold}</td>
                    <td>{it.quantity_returned}</td>
                    <td><span className={it.quantity_returnable > 0 ? 'badge ok' : 'badge low'}>{it.quantity_returnable}</span></td>
                    <td>
                      {sel && (
                        <input type="number" min="1" max={it.quantity_returnable} value={sel.quantity}
                          onChange={(e) => updateSelection(it.sale_item_id, 'quantity', e.target.value)}
                          style={{ width: 60, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 6 }} />
                      )}
                    </td>
                    <td>
                      {sel && (
                        <select value={sel.reason} onChange={(e) => updateSelection(it.sale_item_id, 'reason', e.target.value)}
                          style={{ padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12.5 }}>
                          {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex-between mt-16">
            <div className="text-muted" style={{ fontSize: 13 }}>
              {selectedCount > 0 ? `${selectedCount} item(s) selected · Estimated refund: Rs ${estimatedRefund.toFixed(2)}` : 'Check items above to select them for return'}
            </div>
            <button className="btn btn-accent" disabled={submitting || selectedCount === 0} onClick={submitReturn}>
              {submitting ? 'Processing…' : `Process Return${selectedCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Returns() {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  function reload() {
    setLoading(true);
    api.getReturns().then(setHistory).catch(() => {}).finally(() => setLoading(false));
  }
  React.useEffect(reload, []);

  const filtered = history.filter((r) =>
    !query
    || r.medicine_name.toLowerCase().includes(query.toLowerCase())
    || r.invoice_number.toLowerCase().includes(query.toLowerCase())
    || (r.reason || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalRefunded = filtered.reduce((s, r) => s + Number(r.refund_amount || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Returns &amp; Refunds</h1>
          <div className="topbar-sub">Process a return against a sale — stock is restocked automatically</div>
        </div>
      </div>

      <NewReturnPanel onDone={reload} />

      <div className="stat-grid mt-16" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card"><div className="label">Total Refunded</div><div className="value accent">Rs {totalRefunded.toFixed(2)}</div><div className="sub">across all returns</div></div>
        <div className="stat-card"><div className="label">Total Returns</div><div className="value">{filtered.length}</div><div className="sub">line items returned</div></div>
      </div>

      <div className="card mt-16">
        <div className="section-title">Returns history</div>
        <div className="search-bar" style={{ maxWidth: 360, marginBottom: 14 }}>
          <span className="icon">🔍</span>
          <input placeholder="Search medicine, invoice, reason…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {loading ? <div className="loading-spin"></div> : filtered.length === 0 ? (
          <div className="empty-state">No returns recorded yet</div>
        ) : (
          <table>
            <thead>
              <tr><th>Invoice</th><th>Medicine</th><th>Batch</th><th>Qty</th><th>Refund</th><th>Reason</th><th>Customer</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.return_id}>
                  <td className="mono">{r.invoice_number}</td>
                  <td>{r.medicine_name}</td>
                  <td className="mono">{r.batch_no || '—'}</td>
                  <td>{r.quantity}</td>
                  <td className="mono">Rs {Number(r.refund_amount || 0).toFixed(2)}</td>
                  <td className="text-muted">{r.reason || '—'}</td>
                  <td>{r.customer_name || 'Walk-in'}</td>
                  <td>{new Date(r.return_date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
