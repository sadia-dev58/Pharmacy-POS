function Payments() {
  const [payments, setPayments] = React.useState([]);
  const [method, setMethod] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  function reload() {
    setLoading(true);
    const params = {};
    if (method) params.method = method;
    api.getPayments(params).then(setPayments).catch(() => {}).finally(() => setLoading(false));
  }

  React.useEffect(reload, [method]);

  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div><h1>Payments</h1><div className="topbar-sub">{payments.length} payments · Rs {total.toFixed(2)} total</div></div>
      </div>

      <div className="pill-tabs">
        {['', 'Cash', 'Card', 'Online'].map((m) => (
          <div key={m || 'all'} className={`pill-tab ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>{m || 'All'}</div>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="loading-spin"></div> : (
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th>Transaction ID</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id}>
                  <td className="mono">{p.invoice_number || '—'}</td>
                  <td>{p.customer_name || 'Walk-in'}</td>
                  <td>{p.payment_method}</td>
                  <td className="mono">Rs {parseFloat(p.amount).toFixed(2)}</td>
                  <td><span className={`badge ${p.status === 'Success' ? 'ok' : p.status === 'Pending' ? 'warn' : 'low'}`}>{p.status}</span></td>
                  <td>{p.payment_date ? new Date(p.payment_date).toLocaleString() : '—'}</td>
                  <td className="mono text-muted">{p.transaction_id || '—'}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="7"><div className="empty-state">No payments found</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
