function SupplierFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const isEdit = !!initial.supplier_id;

  function set(f, v) { setForm((s) => ({ ...s, [f]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.updateSupplier(form); else await api.createSupplier(form);
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{isEdit ? 'Edit supplier' : 'Add supplier'}</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="login-error">{error}</div>}
            <div className="field"><label>Company name *</label><input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} autoFocus /></div>
            <div className="field-row">
              <div className="field"><label>Contact person</label><input value={form.contact_person || ''} onChange={(e) => set('contact_person', e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Email</label><input value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="field"><label>City</label><input value={form.city || ''} onChange={(e) => set('city', e.target.value)} /></div>
            </div>
            <div className="field"><label>Address</label><textarea rows="2" value={form.address || ''} onChange={(e) => set('address', e.target.value)}></textarea></div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Suppliers() {
  const [suppliers, setSuppliers] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  function reload() { api.getSuppliers().then(setSuppliers).catch(() => {}); }
  React.useEffect(reload, []);

  const filtered = suppliers.filter((s) => !query || s.company_name.toLowerCase().includes(query.toLowerCase()));

  async function handleDelete(id) {
    if (!confirm('Delete this supplier?')) return;
    try { await api.deleteSupplier(id); reload(); } catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="topbar">
        <div><h1>Suppliers</h1><div className="topbar-sub">{suppliers.length} suppliers</div></div>
        <button className="btn btn-primary" onClick={() => { setEditing({ company_name: '', contact_person: '', phone: '', email: '', address: '', city: '' }); setFormOpen(true); }}>+ Add supplier</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 420 }}>
        <span className="icon">🔍</span>
        <input placeholder="Search company name…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>City</th><th></th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.supplier_id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.company_name} size={30} /><strong>{s.company_name}</strong></div></td>
                <td>{s.contact_person || '—'}</td>
                <td className="mono">{s.phone || '—'}</td>
                <td>{s.city || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditing(s); setFormOpen(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.supplier_id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5"><div className="empty-state">No suppliers found</div></td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && <SupplierFormModal initial={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />}
    </div>
  );
}
