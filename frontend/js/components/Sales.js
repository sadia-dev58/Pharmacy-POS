function Sales() {
  const [sales, setSales] = React.useState([]);
  const [date, setDate] = React.useState('');
  const [viewing, setViewing] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  function reload() {
    setLoading(true);
    api.getSales(date ? { date } : {}).then(setSales).catch(() => {}).finally(() => setLoading(false));
  }

  React.useEffect(reload, [date]);

  async function openReceipt(saleId) {
    try {
      const sale = await api.getSale(saleId);
      setViewing(sale);
    } catch (err) { alert(err.message); }
  }

  const totalForList = sales.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div><h1>Sales history</h1><div className="topbar-sub">{sales.length} transactions{date ? ` on ${date}` : ''} · Rs {totalForList.toFixed(2)} total</div></div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 8 }} />
      </div>

      <div className="card">
        {loading ? <div className="loading-spin"></div> : (
          <table>
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Method</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.sale_id}>
                  <td className="mono">{s.invoice_number}</td>
                  <td>{new Date(s.sale_date).toLocaleString()}</td>
                  <td>{s.customer_name || 'Walk-in'}</td>
                  <td>{s.payment_method}</td>
                  <td className="mono">Rs {parseFloat(s.total_amount).toFixed(2)}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => openReceipt(s.sale_id)}>View receipt</button></td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan="6"><div className="empty-state">No sales found</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {viewing && <ReceiptModal sale={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
