function CustomerFormModal({ onClose, onSaved }) {
  const [form, setForm] = React.useState({ customer_name: '', phone: '', email: '', gender: 'Male', address: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function set(f, v) { setForm((s) => ({ ...s, [f]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.customer_name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await api.createCustomer(form);
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>Add customer</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="login-error">{error}</div>}
            <div className="field"><label>Full name *</label><input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} autoFocus /></div>
            <div className="field-row">
              <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
              <div className="field"><label>Email</label><input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            </div>
            <div className="field">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="field"><label>Address</label><textarea rows="2" value={form.address} onChange={(e) => set('address', e.target.value)}></textarea></div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Customers() {
  const [customers, setCustomers] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);

  function reload() { api.getCustomers().then(setCustomers).catch(() => {}); }
  React.useEffect(reload, []);

  const filtered = customers.filter((c) =>
    !query || c.customer_name.toLowerCase().includes(query.toLowerCase()) || (c.phone || '').includes(query)
  );

  return (
    <div>
      <div className="topbar">
        <div><h1>Customers</h1><div className="topbar-sub">{customers.length} registered</div></div>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Add customer</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 420 }}>
        <span className="icon">🔍</span>
        <input placeholder="Search name or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Gender</th><th>Address</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.customer_id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={c.customer_name} size={30} /><strong>{c.customer_name}</strong></div></td>
                <td className="mono">{c.phone || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.gender || '—'}</td>
                <td className="text-muted">{c.address || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5"><div className="empty-state">No customers found</div></td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && <CustomerFormModal onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />}
    </div>
  );
}
