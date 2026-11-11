function POS() {
  const [medicines, setMedicines] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [cart, setCart] = React.useState([]); // { stock_id, medicine_name, dosage, unit, selling_price, quantity, available }
  const [customers, setCustomers] = React.useState([]);
  const [customerId, setCustomerId] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(5);
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [amountPaid, setAmountPaid] = React.useState('');
  const [showCamera, setShowCamera] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [completedSale, setCompletedSale] = React.useState(null);
  const [justScannedId, setJustScannedId] = React.useState(null);

  React.useEffect(() => {
    api.getMedicines().then(setMedicines).catch(() => {});
    api.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim() === '') {
        api.getMedicines().then(setMedicines).catch(() => {});
      } else {
        api.searchMedicines(query).then(setMedicines).catch(() => {});
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function showToast(message, type = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  }

  function addToCart(med) {
    if (!med.stock_id || med.quantity <= 0) {
      const message = `${med.medicine_name} is out of stock`;
      showToast(message, 'error');
      return { ok: false, message };
    }
    const existing = cart.find((l) => l.stock_id === med.stock_id);
    if (existing && existing.quantity >= med.quantity) {
      const message = 'No more stock available';
      showToast(message, 'error');
      return { ok: false, message };
    }
    setCart((prev) => {
      const existingLine = prev.find((l) => l.stock_id === med.stock_id);
      if (existingLine) {
        return prev.map((l) => l.stock_id === med.stock_id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, {
        stock_id: med.stock_id,
        medicine_name: med.medicine_name,
        dosage: med.dosage,
        unit: med.unit,
        selling_price: parseFloat(med.selling_price),
        quantity: 1,
        available: med.quantity,
      }];
    });
    const message = `Added ${med.medicine_name}`;
    showToast(message);
    // Flash-highlight this line in the cart so a scanned item is visually obvious
    setJustScannedId(med.stock_id);
    setTimeout(() => setJustScannedId((cur) => (cur === med.stock_id ? null : cur)), 1100);
    return { ok: true, message, name: med.medicine_name };
  }

  const handleBarcodeScan = React.useCallback(async (code) => {
    try {
      const med = await api.getMedicineByBarcode(code);
      return addToCart(med);
    } catch (err) {
      const notFound = /No medicine found/i.test(err.message);
      const message = notFound ? `Barcode "${code}" is not in your inventory` : err.message;
      showToast(message, 'error');
      return { ok: false, message };
    }
  }, [cart]);

  useHardwareScanner(handleBarcodeScan, !showCamera && !completedSale);

  function updateQty(stockId, delta) {
    setCart((prev) => prev.map((l) => {
      if (l.stock_id !== stockId) return l;
      const next = l.quantity + delta;
      if (next <= 0) return l;
      if (next > l.available) { showToast('No more stock available', 'error'); return l; }
      return { ...l, quantity: next };
    }));
  }

  function removeLine(stockId) {
    setCart((prev) => prev.filter((l) => l.stock_id !== stockId));
  }

  const subtotal = cart.reduce((s, l) => s + l.selling_price * l.quantity, 0);
  const taxAmount = Math.max(0, (subtotal - Number(discount || 0)) * (Number(taxRate || 0) / 100));
  const total = Math.max(0, subtotal - Number(discount || 0) + taxAmount);
  const change = paymentMethod === 'Cash' ? Math.max(0, Number(amountPaid || 0) - total) : 0;

  async function handleCheckout() {
    if (cart.length === 0) { showToast('Cart is empty', 'error'); return; }
    if (paymentMethod === 'Cash' && Number(amountPaid || 0) < total) {
      showToast('Amount paid is less than total due', 'error');
      return;
    }
    setCheckingOut(true);
    try {
      const sale = await api.checkout({
        customer_id: customerId || null,
        discount: Number(discount || 0),
        tax_rate: Number(taxRate || 0),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'Cash' ? Number(amountPaid || 0) : total,
        items: cart.map((l) => ({ stock_id: l.stock_id, quantity: l.quantity })),
      });
      setCompletedSale(sale);
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
      setCustomerId('');
      api.getMedicines().then(setMedicines).catch(() => {});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Point of Sale</h1>
          <div className="topbar-sub">Scan a barcode, search, or tap a medicine to add it to the cart</div>
        </div>
        <button className="btn btn-accent" style={{ fontSize: 14.5, padding: '11px 20px' }} onClick={() => setShowCamera(true)}>
          📷 Scan barcode with camera
        </button>
      </div>

      <div className="pos-grid">
        <div className="pos-catalog">
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input
              placeholder="Search by name, generic, brand, or scan barcode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-scan-target="true"
            />
          </div>

          <div className="medicine-grid">
            {medicines.map((m) => (
              <div
                key={m.medicine_id}
                className={`medicine-tile ${(!m.quantity || m.quantity <= 0) ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(m)}
              >
                <div className="tile-cat">{m.category_name || 'General'}</div>
                <div className="tile-name">{m.medicine_name}</div>
                <div className="tile-dosage">{m.dosage} · {m.unit}</div>
                <div className="tile-price">Rs {m.selling_price ? parseFloat(m.selling_price).toFixed(2) : '—'}</div>
                <div className="tile-stock">
                  {m.quantity > 0
                    ? <span className={m.quantity <= (m.reorder_level || 10) ? 'badge low' : 'badge ok'}>{m.quantity} in stock</span>
                    : <span className="badge low">Out of stock</span>}
                </div>
              </div>
            ))}
            {medicines.length === 0 && <div className="empty-state">No medicines match your search</div>}
          </div>
        </div>

        <div className="cart-panel">
          <div className="cart-header">
            <h3>Current Sale</h3>
            <div className="scan-hint">Use "Scan barcode with camera" above to add items by barcode</div>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">Cart is empty.<br/>Scan or tap a medicine to begin.</div>
            ) : cart.map((l) => (
              <div className={`cart-line ${justScannedId === l.stock_id ? 'just-scanned' : ''}`} key={l.stock_id}>
                <div className="name">{l.medicine_name}<small>{l.dosage} · Rs {l.selling_price.toFixed(2)}</small></div>
                <div className="qty-ctl">
                  <button onClick={() => updateQty(l.stock_id, -1)}>−</button>
                  <span>{l.quantity}</span>
                  <button onClick={() => updateQty(l.stock_id, 1)}>+</button>
                </div>
                <div>Rs {(l.selling_price * l.quantity).toFixed(2)}</div>
                <div className="remove" onClick={() => removeLine(l.stock_id)}>✕</div>
              </div>
            ))}
          </div>

          <div className="cart-totals">
            <div className="row"><span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span></div>
            <div className="row"><span>Discount (Rs)</span>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                style={{ width: 80, textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px' }} />
            </div>
            <div className="row"><span>Tax (%)</span>
              <input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                style={{ width: 80, textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px' }} />
            </div>
            <div className="row grand"><span>Total</span><span>Rs {total.toFixed(2)}</span></div>
          </div>

          <div className="cart-footer">
            <div className="field">
              <label>Customer (optional)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.customer_name} — {c.phone}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Payment method</label>
              <div className="pill-tabs">
                {['Cash', 'Card', 'Online'].map((pm) => (
                  <div key={pm} className={`pill-tab ${paymentMethod === pm ? 'active' : ''}`} onClick={() => setPaymentMethod(pm)}>{pm}</div>
                ))}
              </div>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="field-row">
                <div className="field">
                  <label>Amount received</label>
                  <input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" />
                </div>
                <div className="field">
                  <label>Change</label>
                  <input value={`Rs ${change.toFixed(2)}`} disabled />
                </div>
              </div>
            )}

            <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }}
              disabled={checkingOut || cart.length === 0} onClick={handleCheckout}>
              {checkingOut ? 'Processing…' : `Complete Sale · Rs ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraBarcodeModal
          onDetected={handleBarcodeScan}
          onClose={() => setShowCamera(false)}
        />
      )}

      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}

      {toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.message}</div>}
    </div>
  );
}
