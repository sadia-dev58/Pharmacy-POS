function Dashboard({ goTo }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [salesRange, setSalesRange] = React.useState('daily'); // daily | weekly | monthly
  const [dismissedNotifs, setDismissedNotifs] = React.useState([]);

  React.useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty-state">{error}</div>;
  if (!data) return <div className="loading-spin"></div>;

  // ---- Automatic notifications: fires whenever the dashboard loads fresh
  // data (i.e. right after any medicine add/update or sale changes stock) ----
  const activeNotifications = data.notifications.filter(
    (n) => !dismissedNotifs.includes(n.type + ':' + n.medicine_name)
  );

  // ---- Sales chart (Daily / Weekly / Monthly) ----
  const rangeData = (data.sales_chart && data.sales_chart[salesRange]) || [];

  // ---- Dedicated Revenue Trend line chart (separate from the chart above) ----
  const dailyData = (data.sales_chart && data.sales_chart.daily) || [];
  const revenueTrendChart = {
    labels: dailyData.map((r) => new Date(r.label).toLocaleDateString(undefined, { weekday: 'short' })),
    datasets: [{ label: 'Revenue', data: dailyData.map((r) => Number(r.total)), borderColor: CHART_COLORS[0] }],
  };
  const rangeLabelFormatter = (label) => {
    if (salesRange === 'monthly') {
      const [y, m] = label.split('-');
      return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    return new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const salesChartData = {
    labels: rangeData.map((r) => rangeLabelFormatter(r.label)),
    datasets: [{
      label: 'Revenue',
      data: rangeData.map((r) => Number(r.total)),
      backgroundColor: 'rgba(27,75,138,0.85)',
      borderColor: CHART_COLORS[0],
      borderRadius: 4,
    }],
  };

  // ---- Inventory overview pie ----
  const stockStatusData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [data.stock_status.in_stock, data.stock_status.low_stock, data.stock_status.out_of_stock],
      backgroundColor: [CHART_COLORS[2], CHART_COLORS[1], CHART_COLORS[3]],
    }],
  };

  // ---- Best selling medicines ----
  const bestSellingChart = {
    labels: data.best_selling.map((m) => m.medicine_name),
    datasets: [{ label: 'Units sold', data: data.best_selling.map((m) => Number(m.total_quantity)), backgroundColor: CHART_COLORS[0], borderRadius: 4 }],
  };

  const quickActions = [
    { icon: '➕', label: 'Add Medicine', page: 'medicines' },
    { icon: '🛒', label: 'New Sale', page: 'pos' },
    { icon: '👤', label: 'Add Customer', page: 'customers' },
    { icon: '🚚', label: 'Add Supplier', page: 'suppliers' },
    { icon: '📄', label: 'Generate Report', page: 'report-generator' },
  ];

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="topbar-sub">Today, {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <button className="btn btn-accent" onClick={() => goTo('pos')}>+ New Sale</button>
      </div>

      {/* Automatic notifications: quantity <= 5 -> low stock, quantity == 0 -> out of stock */}
      {activeNotifications.length > 0 && (
        <div className="card mt-16" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-light)' }}>
          <div className="section-title" style={{ marginBottom: 8 }}>🔔 Stock notifications</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {activeNotifications.map((n, i) => {
              const key = n.type + ':' + n.medicine_name;
              return (
                <div key={i} className={`badge ${n.type === 'out' ? 'low' : 'warn'}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
                  {n.type === 'out' ? `⛔ ${n.medicine_name} — Out of Stock` : `⚠️ ${n.medicine_name} — Low Stock (${n.quantity} left)`}
                  <span style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setDismissedNotifs((d) => [...d, key])}>✕</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue Section */}
      <div className="stat-grid mt-16" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="label">Today's Revenue</div>
          <div className="value">Rs {data.today_sales_total.toFixed(2)}</div>
          <div className="sub">{data.today_sales_count} transactions</div>
        </div>
        <div className="stat-card">
          <div className="label">This Week</div>
          <div className="value">Rs {data.week_sales_total.toFixed(2)}</div>
          <div className="sub">week to date</div>
        </div>
        <div className="stat-card">
          <div className="label">This Month</div>
          <div className="value">Rs {data.month_sales_total.toFixed(2)}</div>
          <div className="sub">month to date</div>
        </div>
      </div>

      {/* Revenue Trend — new dedicated line chart */}
      <div className="mt-16">
        <ChartCard title="Revenue trend — last 7 days" type="line" data={revenueTrendChart} height={220} />
      </div>

      {/* Quick Actions */}
      <div className="card mt-16">
        <div className="section-title">Quick actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((a) => (
            <button key={a.page} className="btn btn-outline" onClick={() => goTo(a.page)}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales chart with Daily / Weekly / Monthly toggle */}
      <div className="two-col mt-16">
        <ChartCard
          key={salesRange}
          title={<>Sales chart
            <div className="pill-tabs" style={{ margin: 0 }}>
              <div className={`pill-tab ${salesRange === 'daily' ? 'active' : ''}`} onClick={() => setSalesRange('daily')}>Daily (7d)</div>
              <div className={`pill-tab ${salesRange === 'weekly' ? 'active' : ''}`} onClick={() => setSalesRange('weekly')}>Weekly</div>
              <div className={`pill-tab ${salesRange === 'monthly' ? 'active' : ''}`} onClick={() => setSalesRange('monthly')}>Monthly</div>
            </div>
          </>}
          type="bar" data={salesChartData} height={230} options={{ scales: { y: { beginAtZero: true } } }}
        />

        <ChartCard title="Inventory overview" type="pie" data={stockStatusData} height={280} />
      </div>

      {/* Best selling medicines */}
      <div className="two-col mt-16">
        <ChartCard title="Best selling medicines" type="bar" data={bestSellingChart} height={240}
          options={{ indexAxis: 'y', scales: { x: { beginAtZero: true } } }} />

        <div className="card">
          <div className="section-title">Best sellers — detail</div>
          {data.best_selling.length === 0 ? <div className="empty-state">No sales yet</div> : (
            <table>
              <thead><tr><th>Medicine</th><th>Units sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.best_selling.map((m, i) => (
                  <tr key={i}>
                    <td>{m.medicine_name}</td>
                    <td><span className="badge ok">{m.total_quantity}</span></td>
                    <td className="mono">Rs {parseFloat(m.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="two-col mt-16">
        <div className="card">
          <div className="section-title">
            Recent sales
            <span className="text-muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => goTo('sales')}>View all →</span>
          </div>
          {data.recent_sales.length === 0 ? <div className="empty-state">No sales yet</div> : (
            <table>
              <thead><tr><th>Invoice</th><th>Customer</th><th>Method</th><th>Total</th></tr></thead>
              <tbody>
                {data.recent_sales.map((s) => (
                  <tr key={s.sale_id}>
                    <td className="mono">{s.invoice_number}</td>
                    <td>{s.customer_name || 'Walk-in'}</td>
                    <td>{s.payment_method}</td>
                    <td className="mono">Rs {parseFloat(s.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="section-title">Low stock alerts</div>
          {data.low_stock.length === 0 ? <div className="empty-state">All stocked up 🎉</div> : (
            <table>
              <thead><tr><th>Medicine</th><th>Qty</th><th>Reorder at</th></tr></thead>
              <tbody>
                {data.low_stock.slice(0, 8).map((s, i) => (
                  <tr key={i}>
                    <td>{s.medicine_name}</td>
                    <td><span className="badge low">{s.quantity}</span></td>
                    <td className="text-muted">{s.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data.expiring_soon.length > 0 && (
            <>
              <div className="section-title mt-16">Expiring soon</div>
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th></tr></thead>
                <tbody>
                  {data.expiring_soon.slice(0, 6).map((s, i) => (
                    <tr key={i}>
                      <td>{s.medicine_name}</td>
                      <td className="mono">{s.batch_no}</td>
                      <td className="expiry-warn">{s.expiry_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
