function NewPurchaseModal({ suppliers, medicines, onClose, onSaved }) {
  const [supplierId, setSupplierId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [items, setItems] = React.useState([]);
  const [draft, setDraft] = React.useState({ medicine_id: '', quantity: '', purchase_price: '', selling_price: '', batch_no: '', expiry_date: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function addLine() {
    if (!draft.medicine_id || !draft.quantity || !draft.purchase_price || !draft.selling_price) {
      setError('Fill medicine, quantity, purchase price, and selling price before adding');
      return;
    }
    const med = medicines.find((m) => String(m.medicine_id) === String(draft.medicine_id));
    setItems((prev) => [...prev, { ...draft, medicine_name: med ? med.medicine_name : '' }]);
    setDraft({ medicine_id: '', quantity: '', purchase_price: '', selling_price: '', batch_no: '', expiry_date: '' });
    setError('');
  }

  function removeLine(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  const total = items.reduce((s, it) => s + Number(it.purchase_price) * Number(it.quantity), 0);

  async function submit() {
    if (!supplierId) { setError('Select a supplier'); return; }
    if (items.length === 0) { setError('Add at least one item'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createPurchase({
        supplier_id: supplierId,
        payment_method: paymentMethod,
        payment_status: 'Paid',
        items: items.map((it) => ({
          medicine_id: it.medicine_id, quantity: Number(it.quantity),
          purchase_price: Number(it.purchase_price), selling_price: Number(it.selling_price),
          batch_no: it.batch_no || null, expiry_date: it.expiry_date || null,
        })),
      });
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>New purchase order</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <div className="modal-body">
          {error && <div className="login-error">{error}</div>}
          <div className="field-row">
            <div className="field">
              <label>Supplier *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.company_name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Cash</option><option>Card</option><option>Online</option>
              </select>
            </div>
          </div>

          <div className="section-title mt-16">Add item</div>
          <div className="field-row">
            <div className="field">
              <label>Medicine</label>
              <select value={draft.medicine_id} onChange={(e) => setDraft((d) => ({ ...d, medicine_id: e.target.value }))}>
                <option value="">Select…</option>
                {medicines.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}</option>)}
              </select>
            </div>
            <div className="field"><label>Quantity</label><input type="number" value={draft.quantity} onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Purchase price (Rs)</label><input type="number" step="0.01" value={draft.purchase_price} onChange={(e) => setDraft((d) => ({ ...d, purchase_price: e.target.value }))} /></div>
            <div className="field"><label>Selling price (Rs)</label><input type="number" step="0.01" value={draft.selling_price} onChange={(e) => setDraft((d) => ({ ...d, selling_price: e.target.value }))} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Batch no.</label><input value={draft.batch_no} onChange={(e) => setDraft((d) => ({ ...d, batch_no: e.target.value }))} /></div>
            <div className="field"><label>Expiry date</label><input type="date" value={draft.expiry_date} onChange={(e) => setDraft((d) => ({ ...d, expiry_date: e.target.value }))} /></div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={addLine}>+ Add item to order</button>

          {items.length > 0 && (
            <table className="mt-16">
              <thead><tr><th>Medicine</th><th>Qty</th><th>Purchase price</th><th>Selling price</th><th>Batch</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.medicine_name}</td><td>{it.quantity}</td>
                    <td className="mono">Rs {Number(it.purchase_price).toFixed(2)}</td>
                    <td className="mono">Rs {Number(it.selling_price).toFixed(2)}</td>
                    <td className="mono">{it.batch_no || '—'}</td>
                    <td><span className="remove" style={{ color: 'var(--color-danger)', cursor: 'pointer' }} onClick={() => removeLine(i)}>✕</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {items.length > 0 && <div className="mt-8" style={{ textAlign: 'right', fontWeight: 700 }}>Order total: Rs {total.toFixed(2)}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Record purchase'}</button>
        </div>
      </div>
    </div>
  );
}

function Purchases() {
  const [purchases, setPurchases] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [medicines, setMedicines] = React.useState([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  function reload() {
    setLoading(true);
    api.getPurchases().then(setPurchases).catch(() => {}).finally(() => setLoading(false));
  }

  React.useEffect(() => {
    reload();
    api.getSuppliers().then(setSuppliers).catch(() => {});
    api.getMedicines().then(setMedicines).catch(() => {});
  }, []);

  return (
    <div>
      <div className="topbar">
        <div><h1>Purchases</h1><div className="topbar-sub">Stock received from suppliers</div></div>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ New purchase</button>
      </div>

      <div className="card">
        {loading ? <div className="loading-spin"></div> : (
          <table>
            <thead><tr><th>Invoice</th><th>Supplier</th><th>Date</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.purchase_id}>
                  <td className="mono">{p.invoice_number}</td>
                  <td>{p.supplier_name || '—'}</td>
                  <td>{p.purchase_date}</td>
                  <td>{p.payment_method}</td>
                  <td><span className={`badge ${p.payment_status === 'Paid' ? 'ok' : 'warn'}`}>{p.payment_status}</span></td>
                  <td className="mono">Rs {parseFloat(p.total_amount).toFixed(2)}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan="6"><div className="empty-state">No purchases recorded yet</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <NewPurchaseModal
          suppliers={suppliers}
          medicines={medicines}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}
