const emptyMedForm = {
  medicine_id: null, medicine_name: '', generic_name: '', brand_name: '', manufacturer: '',
  category_id: '', barcode: '', dosage: '', unit: 'Strip', description: '',
  selling_price: '', purchase_price: '', quantity: '', reorder_level: 10,
  batch_no: '', supplier_id: '', manufacture_date: '', expiry_date: '',
};

function MedicineFormModal({ initial, categories, suppliers, onClose, onSaved }) {
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const isEdit = !!initial.medicine_id;

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.medicine_name.trim()) { setError('Medicine name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateMedicine(form);
      } else {
        await api.createMedicine(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? 'Edit medicine' : 'Add medicine'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="login-error">{error}</div>}

            <div className="field-row">
              <div className="field"><label>Medicine name *</label><input value={form.medicine_name} onChange={(e) => set('medicine_name', e.target.value)} autoFocus /></div>
              <div className="field"><label>Barcode</label><input value={form.barcode || ''} onChange={(e) => set('barcode', e.target.value)} placeholder="Scan or type…" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Generic name</label><input value={form.generic_name || ''} onChange={(e) => set('generic_name', e.target.value)} /></div>
              <div className="field"><label>Brand name</label><input value={form.brand_name || ''} onChange={(e) => set('brand_name', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Manufacturer</label><input value={form.manufacturer || ''} onChange={(e) => set('manufacturer', e.target.value)} /></div>
              <div className="field">
                <label>Category</label>
                <select value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Dosage</label><input value={form.dosage || ''} onChange={(e) => set('dosage', e.target.value)} placeholder="e.g. 500mg" /></div>
              <div className="field">
                <label>Unit</label>
                <select value={form.unit || 'Strip'} onChange={(e) => set('unit', e.target.value)}>
                  {['Piece', 'Strip', 'Box', 'Bottle', 'Tube'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="field"><label>Description</label><textarea rows="2" value={form.description || ''} onChange={(e) => set('description', e.target.value)}></textarea></div>

            <div className="section-title mt-16">{isEdit ? 'Stock batch (edits linked batch)' : 'Initial stock batch'}</div>
            <div className="field-row">
              <div className="field"><label>Selling price (Rs)</label><input type="number" step="0.01" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} /></div>
              <div className="field"><label>Purchase price (Rs)</label><input type="number" step="0.01" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></div>
              <div className="field"><label>Reorder level</label><input type="number" value={form.reorder_level} onChange={(e) => set('reorder_level', e.target.value)} /></div>
            </div>
            {!isEdit && (
              <div className="field-row">
                <div className="field"><label>Batch no.</label><input value={form.batch_no} onChange={(e) => set('batch_no', e.target.value)} /></div>
                <div className="field">
                  <label>Supplier</label>
                  <select value={form.supplier_id || ''} onChange={(e) => set('supplier_id', e.target.value)}>
                    <option value="">—</option>
                    {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.company_name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="field-row">
              <div className="field"><label>Manufacture date</label><input type="date" value={form.manufacture_date || ''} onChange={(e) => set('manufacture_date', e.target.value)} /></div>
              <div className="field"><label>Expiry date</label><input type="date" value={form.expiry_date || ''} onChange={(e) => set('expiry_date', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save medicine'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RestockModal({ medicine, suppliers, onClose, onSaved }) {
  const [form, setForm] = React.useState({
    medicine_id: medicine.medicine_id, quantity: '', selling_price: medicine.selling_price || '',
    purchase_price: '', batch_no: '', supplier_id: '', reorder_level: medicine.reorder_level || 10,
    manufacture_date: '', expiry_date: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.quantity || !form.selling_price) { setError('Quantity and selling price are required'); return; }
    setSaving(true);
    try {
      await api.addStock(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>Restock — {medicine.medicine_name}</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="login-error">{error}</div>}
            <div className="field-row">
              <div className="field"><label>Quantity received *</label><input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} autoFocus /></div>
              <div className="field"><label>Selling price (Rs) *</label><input type="number" step="0.01" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Purchase price (Rs)</label><input type="number" step="0.01" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} /></div>
              <div className="field"><label>Batch no.</label><input value={form.batch_no} onChange={(e) => set('batch_no', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Supplier</label>
                <select value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
                  <option value="">—</option>
                  {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.company_name}</option>)}
                </select>
              </div>
              <div className="field"><label>Reorder level</label><input type="number" value={form.reorder_level} onChange={(e) => set('reorder_level', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Manufacture date</label><input type="date" value={form.manufacture_date} onChange={(e) => set('manufacture_date', e.target.value)} /></div>
              <div className="field"><label>Expiry date</label><input type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add batch'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Medicines() {
  const [medicines, setMedicines] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [restocking, setRestocking] = React.useState(null);

  function reload() {
    api.getMedicines().then(setMedicines).catch(() => {});
  }

  React.useEffect(() => {
    reload();
    api.getCategories().then(setCategories).catch(() => {});
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const filtered = medicines.filter((m) =>
    !query || m.medicine_name.toLowerCase().includes(query.toLowerCase()) || (m.barcode || '').includes(query)
  );

  async function handleDelete(id) {
    if (!confirm('Delete this medicine? This cannot be undone.')) return;
    try {
      await api.deleteMedicine(id);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Medicines</h1>
          <div className="topbar-sub">{medicines.length} medicines in catalog</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing({ ...emptyMedForm }); setFormOpen(true); }}>+ Add medicine</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 420 }}>
        <span className="icon">🔍</span>
        <input placeholder="Search name or barcode…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Medicine</th><th>Category</th><th>Barcode</th><th>Price</th><th>Stock</th><th>Expiry</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.medicine_id}>
                <td><strong>{m.medicine_name}</strong><div className="text-muted" style={{ fontSize: 12 }}>{m.generic_name}</div></td>
                <td>{m.category_name || '—'}</td>
                <td className="mono">{m.barcode || '—'}</td>
                <td className="mono">{m.selling_price ? `Rs ${parseFloat(m.selling_price).toFixed(2)}` : '—'}</td>
                <td>
                  {m.quantity != null
                    ? <span className={m.quantity <= (m.reorder_level || 10) ? 'badge low' : 'badge ok'}>{m.quantity} {m.unit || ''}</span>
                    : <span className="badge low">No stock</span>}
                </td>
                <td className={m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 90*86400000) ? 'expiry-warn' : ''}>{m.expiry_date || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setRestocking(m)}>Restock</button>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      setEditing({
                        ...emptyMedForm, ...m,
                        category_id: m.category_id || '', selling_price: m.selling_price || '',
                        purchase_price: m.purchase_price || '', quantity: m.quantity || '',
                        reorder_level: m.reorder_level || 10, expiry_date: m.expiry_date || '', manufacture_date: m.manufacture_date || '',
                      });
                      setFormOpen(true);
                    }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.medicine_id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7"><div className="empty-state">No medicines found</div></td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <MedicineFormModal
          initial={editing}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); reload(); }}
        />
      )}

      {restocking && (
        <RestockModal
          medicine={restocking}
          suppliers={suppliers}
          onClose={() => setRestocking(null)}
          onSaved={() => { setRestocking(null); reload(); }}
        />
      )}
    </div>
  );
}
