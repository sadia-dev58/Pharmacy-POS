function Inventory() {
  const [stock, setStock] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all | low | expiring
  const [loading, setLoading] = React.useState(true);

  function reload() {
    setLoading(true);
    api.getAllStock().then(setStock).catch(() => {}).finally(() => setLoading(false));
  }
  React.useEffect(reload, []);

  const now90 = new Date(Date.now() + 90 * 86400000);

  const filtered = stock.filter((s) => {
    if (query && !s.medicine_name.toLowerCase().includes(query.toLowerCase()) && !(s.batch_no || '').toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === 'low' && !(s.quantity <= (s.reorder_level || 10))) return false;
    if (filter === 'expiring' && !(s.expiry_date && new Date(s.expiry_date) <= now90)) return false;
    return true;
  });

  return (
    <div>
      <div className="topbar">
        <div><h1>Inventory</h1><div className="topbar-sub">{stock.length} stock batches across all medicines</div></div>
      </div>

      <div className="pill-tabs">
        <div className={`pill-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All batches</div>
        <div className={`pill-tab ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')}>Low stock</div>
        <div className={`pill-tab ${filter === 'expiring' ? 'active' : ''}`} onClick={() => setFilter('expiring')}>Expiring soon</div>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 420 }}>
        <span className="icon">🔍</span>
        <input placeholder="Search medicine or batch no…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {loading ? <div className="loading-spin"></div> : (
          <table>
            <thead><tr><th>Medicine</th><th>Batch</th><th>Category</th><th>Supplier</th><th>Qty</th><th>Purchase</th><th>Selling</th><th>Expiry</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.stock_id}>
                  <td><strong>{s.medicine_name}</strong><div className="text-muted" style={{ fontSize: 12 }}>{s.dosage} · {s.unit}</div></td>
                  <td className="mono">{s.batch_no || '—'}</td>
                  <td>{s.category_name || '—'}</td>
                  <td>{s.supplier_name || '—'}</td>
                  <td><span className={s.quantity <= (s.reorder_level || 10) ? 'badge low' : 'badge ok'}>{s.quantity}</span></td>
                  <td className="mono">Rs {parseFloat(s.purchase_price || 0).toFixed(2)}</td>
                  <td className="mono">Rs {parseFloat(s.selling_price || 0).toFixed(2)}</td>
                  <td className={s.expiry_date && new Date(s.expiry_date) <= now90 ? 'expiry-warn' : ''}>{s.expiry_date || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8"><div className="empty-state">No stock batches match</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
