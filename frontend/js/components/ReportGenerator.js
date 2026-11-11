/**
 * Report Generator
 * A standalone reporting module: Sales / Medicine Stock / Low Stock / Expiry.
 * Each report has its own search, sortable columns, pagination, and
 * Print / PDF / Excel export - built independently of the existing
 * "Reports" (charts/analytics) page, which this does not touch.
 */

const REPORT_PAGE_SIZE = 10;

/** Shared search + sort + pagination behavior for every report table below. */
function useTableControls(rows, searchKeys, pageSize = REPORT_PAGE_SIZE) {
  const [query, setQuery] = React.useState('');
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
  }, [rows, query]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const an = Number(av), bn = Number(bv);
      const bothNumeric = av !== '' && bv !== '' && av != null && bv != null && !isNaN(an) && !isNaN(bn);
      const cmp = bothNumeric ? (an - bn) : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  React.useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  return { query, setQuery, page, setPage, totalPages, pageRows, sortKey, sortDir, toggleSort, sortedAll: sorted };
}

function SortHeader({ label, sortKey, activeKey, activeDir, onSort }) {
  const active = sortKey === activeKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} <span style={{ opacity: active ? 1 : 0.25 }}>{active && activeDir === 'desc' ? '▼' : '▲'}</span>
    </th>
  );
}

function PaginationBar({ page, totalPages, setPage, count }) {
  if (count === 0) return null;
  return (
    <div className="flex-between mt-8" style={{ fontSize: 12.5 }}>
      <span className="text-muted">{count} record{count !== 1 ? 's' : ''}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span className="text-muted">Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>
    </div>
  );
}

/** Always-mounted, screen-hidden table used only when printing (see .print-only in style.css) */
function PrintableReport({ title, subtitle, columns, rows }) {
  return (
    <div id="print-report-root" className="print-only">
      <h2 style={{ marginBottom: 2 }}>{title}</h2>
      {subtitle && <div style={{ color: '#5C6E87', fontSize: 12.5, marginBottom: 14 }}>{subtitle}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ textAlign: 'left', borderBottom: '2px solid #333', padding: '6px 8px', fontSize: 11 }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key} style={{ borderBottom: '1px solid #ddd', padding: '5px 8px', fontSize: 11 }}>{c.format ? c.format(r[c.key], r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exportRowsToExcel(filename, columns, rows) {
  const data = rows.map((r) => {
    const obj = {};
    columns.forEach((c) => { obj[c.label] = c.format ? c.format(r[c.key], r) : r[c.key]; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportRowsToPdf(title, columns, rows) {
  const doc = new window.jspdf.jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.autoTable({
    startY: 21,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(c.format ? c.format(r[c.key], r) : (r[c.key] ?? '')))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [27, 75, 138] },
  });
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

/** Shared export button row (Print / PDF / Excel) for every report tab */
function ExportBar({ title, columns, rows }) {
  return (
    <div className="no-print" style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨️ Print</button>
      <button className="btn btn-outline btn-sm" onClick={() => exportRowsToPdf(title, columns, rows)}>⬇ PDF</button>
      <button className="btn btn-outline btn-sm" onClick={() => exportRowsToExcel(title.replace(/\s+/g, '_'), columns, rows)}>⬇ Excel</button>
    </div>
  );
}

function ReportStatus({ loading, error, empty }) {
  if (loading) return <div className="loading-spin"></div>;
  if (error) return <div className="empty-state" style={{ color: 'var(--color-danger)' }}>Couldn't load this report: {error}</div>;
  if (empty) return <div className="empty-state">No records found for the current filters</div>;
  return null;
}

/* ============================== 1. Sales Report ============================== */

function SalesReportTab() {
  const [from, setFrom] = React.useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  function load() {
    setLoading(true);
    setError('');
    api.getSales({ from, to }).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  React.useEffect(load, []);

  const columns = [
    { key: 'invoice_number', label: 'Bill Number' },
    { key: 'sale_date', label: 'Date', format: (v) => v ? new Date(v).toLocaleString() : '' },
    { key: 'total_amount', label: 'Total Amount', format: (v) => `Rs ${Number(v || 0).toFixed(2)}` },
    { key: 'payment_method', label: 'Payment Method', format: (v) => v || '—' },
  ];

  const t = useTableControls(rows, ['invoice_number', 'payment_method', 'customer_name']);
  const totalSales = t.sortedAll.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  const trendChart = React.useMemo(() => {
    const byDay = {};
    t.sortedAll.forEach((r) => {
      const day = String(r.sale_date).slice(0, 10);
      byDay[day] = (byDay[day] || 0) + Number(r.total_amount || 0);
    });
    const days = Object.keys(byDay).sort();
    return {
      labels: days.map((d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [{ label: 'Revenue', data: days.map((d) => byDay[d]), borderColor: CHART_COLORS[0] }],
    };
  }, [t.sortedAll]);

  return (
    <div>
      <div className="flex-between mt-16" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <span className="text-muted">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
        </div>
        <ExportBar title="Sales Report" columns={columns} rows={t.sortedAll} />
      </div>

      <div className="mt-16">
        <ChartCard title="Revenue trend for selected range" type="line" data={trendChart} height={220} />
      </div>

      <div className="stat-grid mt-16" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card"><div className="label">Total Sales</div><div className="value">Rs {totalSales.toFixed(2)}</div><div className="sub">{from} → {to}</div></div>
        <div className="stat-card"><div className="label">Total Number of Bills</div><div className="value">{t.sortedAll.length}</div><div className="sub">matching current filters</div></div>
      </div>

      <div className="card mt-16">
        <div className="search-bar" style={{ maxWidth: 360, marginBottom: 14 }}>
          <span className="icon">🔍</span>
          <input placeholder="Search bill number, payment method, customer…" value={t.query} onChange={(e) => t.setQuery(e.target.value)} />
        </div>

        <ReportStatus loading={loading} error={error} empty={!loading && !error && t.sortedAll.length === 0} />

        {!loading && !error && t.sortedAll.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <SortHeader label="Bill Number" sortKey="invoice_number" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Date" sortKey="sale_date" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Total Amount" sortKey="total_amount" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Payment Method" sortKey="payment_method" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {t.pageRows.map((r) => (
                  <tr key={r.sale_id}>
                    <td className="mono">{r.invoice_number}</td>
                    <td>{new Date(r.sale_date).toLocaleString()}</td>
                    <td className="mono">Rs {Number(r.total_amount || 0).toFixed(2)}</td>
                    <td>{r.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar page={t.page} totalPages={t.totalPages} setPage={t.setPage} count={t.sortedAll.length} />
          </>
        )}
      </div>

      <PrintableReport title="Sales Report" subtitle={`${from} to ${to} — Total Sales: Rs ${totalSales.toFixed(2)} — Total Bills: ${t.sortedAll.length}`} columns={columns} rows={t.sortedAll} />
    </div>
  );
}

/* ========================= 2. Medicine Stock Report ========================= */

function MedicineStockReportTab() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.getAllStock().then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'medicine_name', label: 'Medicine Name' },
    { key: 'barcode', label: 'Barcode', format: (v) => v || '—' },
    { key: 'category_name', label: 'Category', format: (v) => v || '—' },
    { key: 'quantity', label: 'Current Stock' },
    { key: 'selling_price', label: 'Unit Price', format: (v) => `Rs ${Number(v || 0).toFixed(2)}` },
  ];

  const t = useTableControls(rows, ['medicine_name', 'barcode', 'category_name']);

  const categoryChart = React.useMemo(() => {
    const byCat = {};
    t.sortedAll.forEach((r) => {
      const cat = r.category_name || 'Uncategorized';
      byCat[cat] = (byCat[cat] || 0) + 1;
    });
    const cats = Object.keys(byCat);
    return {
      labels: cats,
      datasets: [{ data: cats.map((c) => byCat[c]), backgroundColor: CHART_COLORS }],
    };
  }, [t.sortedAll]);

  return (
    <div>
      <div className="flex-between mt-16">
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="icon">🔍</span>
          <input placeholder="Search medicine, barcode, category…" value={t.query} onChange={(e) => t.setQuery(e.target.value)} />
        </div>
        <ExportBar title="Medicine Stock Report" columns={columns} rows={t.sortedAll} />
      </div>

      <div className="mt-16">
        <ChartCard title="Stock distribution by category" type="pie" data={categoryChart} height={240} />
      </div>

      <div className="card mt-16">
        <ReportStatus loading={loading} error={error} empty={!loading && !error && t.sortedAll.length === 0} />

        {!loading && !error && t.sortedAll.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <SortHeader label="Medicine Name" sortKey="medicine_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Barcode" sortKey="barcode" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Category" sortKey="category_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Current Stock" sortKey="quantity" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Unit Price" sortKey="selling_price" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {t.pageRows.map((r) => (
                  <tr key={r.stock_id}>
                    <td><strong>{r.medicine_name}</strong></td>
                    <td className="mono">{r.barcode || '—'}</td>
                    <td>{r.category_name || '—'}</td>
                    <td>{r.quantity}</td>
                    <td className="mono">Rs {Number(r.selling_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar page={t.page} totalPages={t.totalPages} setPage={t.setPage} count={t.sortedAll.length} />
          </>
        )}
      </div>

      <PrintableReport title="Medicine Stock Report" columns={columns} rows={t.sortedAll} />
    </div>
  );
}

/* ============================ 3. Low Stock Report ============================ */

function LowStockReportTab() {
  const [allRows, setAllRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [threshold, setThreshold] = React.useState(10);

  React.useEffect(() => {
    api.getAllStock().then(setAllRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const rows = React.useMemo(() => allRows.filter((r) => Number(r.quantity) < Number(threshold || 0)), [allRows, threshold]);

  const columns = [
    { key: 'medicine_name', label: 'Medicine Name' },
    { key: 'barcode', label: 'Barcode', format: (v) => v || '—' },
    { key: 'category_name', label: 'Category', format: (v) => v || '—' },
    { key: 'quantity', label: 'Current Stock' },
    { key: 'selling_price', label: 'Unit Price', format: (v) => `Rs ${Number(v || 0).toFixed(2)}` },
  ];

  const t = useTableControls(rows, ['medicine_name', 'barcode', 'category_name']);

  const lowStockChart = React.useMemo(() => {
    const top = [...t.sortedAll].sort((a, b) => Number(a.quantity) - Number(b.quantity)).slice(0, 8);
    return {
      labels: top.map((r) => r.medicine_name),
      datasets: [{ label: 'Stock left', data: top.map((r) => Number(r.quantity)), backgroundColor: CHART_COLORS[3] }],
    };
  }, [t.sortedAll]);

  return (
    <div>
      <div className="flex-between mt-16" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar" style={{ maxWidth: 300 }}>
            <span className="icon">🔍</span>
            <input placeholder="Search medicine, barcode…" value={t.query} onChange={(e) => t.setQuery(e.target.value)} />
          </div>
          <label style={{ fontSize: 12.5, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Threshold
            <input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)}
              style={{ width: 70, padding: '7px 9px', border: '1px solid var(--color-border)', borderRadius: 6 }} />
          </label>
        </div>
        <ExportBar title="Low Stock Report" columns={columns} rows={t.sortedAll} />
      </div>

      <div className="mt-16">
        <ChartCard title="Lowest stock levels" type="bar" data={lowStockChart} height={240}
          options={{ indexAxis: 'y' }} />
      </div>

      <div className="card mt-16">
        <ReportStatus loading={loading} error={error} empty={!loading && !error && t.sortedAll.length === 0} />

        {!loading && !error && t.sortedAll.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <SortHeader label="Medicine Name" sortKey="medicine_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Barcode" sortKey="barcode" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Category" sortKey="category_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Current Stock" sortKey="quantity" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Unit Price" sortKey="selling_price" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {t.pageRows.map((r) => (
                  <tr key={r.stock_id} className="report-row-danger">
                    <td><strong>{r.medicine_name}</strong></td>
                    <td className="mono">{r.barcode || '—'}</td>
                    <td>{r.category_name || '—'}</td>
                    <td>{r.quantity}</td>
                    <td className="mono">Rs {Number(r.selling_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar page={t.page} totalPages={t.totalPages} setPage={t.setPage} count={t.sortedAll.length} />
          </>
        )}
      </div>

      <PrintableReport title="Low Stock Report" subtitle={`Threshold: below ${threshold} units`} columns={columns} rows={t.sortedAll} />
    </div>
  );
}

/* ============================== 4. Expiry Report ============================== */

function ExpiryReportTab() {
  const [allRows, setAllRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.getAllStock().then(setAllRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today.getTime() + 30 * 86400000);

  const rows = React.useMemo(() => {
    return allRows
      .filter((r) => r.expiry_date)
      .filter((r) => new Date(r.expiry_date) <= in30Days)
      .map((r) => ({ ...r, status: new Date(r.expiry_date) < today ? 'Expired' : 'Expiring Soon' }));
  }, [allRows]);

  const columns = [
    { key: 'medicine_name', label: 'Medicine Name' },
    { key: 'batch_no', label: 'Batch', format: (v) => v || '—' },
    { key: 'category_name', label: 'Category', format: (v) => v || '—' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status' },
  ];

  const t = useTableControls(rows, ['medicine_name', 'batch_no', 'category_name']);

  const expiryHeatmap = React.useMemo(() => {
    const cats = [...new Set(t.sortedAll.map((r) => r.category_name || 'Uncategorized'))];
    const cols = ['Expired', 'Expiring Soon'];
    const matrix = cats.map((cat) => cols.map((status) =>
      t.sortedAll.filter((r) => (r.category_name || 'Uncategorized') === cat && r.status === status).length
    ));
    return { rows: cats, cols, matrix };
  }, [t.sortedAll]);

  return (
    <div>
      <div className="flex-between mt-16">
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="icon">🔍</span>
          <input placeholder="Search medicine, batch, category…" value={t.query} onChange={(e) => t.setQuery(e.target.value)} />
        </div>
        <ExportBar title="Expiry Report" columns={columns} rows={t.sortedAll} />
      </div>

      <div className="mt-16">
        <ChartCard title="Expiry risk by category" type="heatmap" data={expiryHeatmap} height={260} />
      </div>

      <div className="card mt-16">
        <ReportStatus loading={loading} error={error} empty={!loading && !error && t.sortedAll.length === 0} />

        {!loading && !error && t.sortedAll.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <SortHeader label="Medicine Name" sortKey="medicine_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Batch" sortKey="batch_no" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Category" sortKey="category_name" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Expiry Date" sortKey="expiry_date" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <SortHeader label="Quantity" sortKey="quantity" activeKey={t.sortKey} activeDir={t.sortDir} onSort={t.toggleSort} />
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {t.pageRows.map((r) => (
                  <tr key={r.stock_id} className={r.status === 'Expired' ? 'report-row-danger' : 'report-row-warn'}>
                    <td><strong>{r.medicine_name}</strong></td>
                    <td className="mono">{r.batch_no || '—'}</td>
                    <td>{r.category_name || '—'}</td>
                    <td>{r.expiry_date}</td>
                    <td>{r.quantity}</td>
                    <td><span className={`badge ${r.status === 'Expired' ? 'low' : 'warn'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar page={t.page} totalPages={t.totalPages} setPage={t.setPage} count={t.sortedAll.length} />
          </>
        )}
      </div>

      <PrintableReport title="Expiry Report" subtitle="Expired medicines and medicines expiring within 30 days" columns={columns} rows={t.sortedAll} />
    </div>
  );
}

/* =============================== Main page shell =============================== */

const REPORT_TABS = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'stock', label: 'Medicine Stock Report' },
  { key: 'low-stock', label: 'Low Stock Report' },
  { key: 'expiry', label: 'Expiry Report' },
];

function ReportGenerator() {
  const [tab, setTab] = React.useState('sales');

  return (
    <div>
      <div className="topbar no-print">
        <div>
          <h1>Report Generator</h1>
          <div className="topbar-sub">Generate, filter, and export detailed pharmacy reports</div>
        </div>
      </div>

      <div className="pill-tabs no-print">
        {REPORT_TABS.map((t) => (
          <div key={t.key} className={`pill-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab === 'sales' && <SalesReportTab />}
      {tab === 'stock' && <MedicineStockReportTab />}
      {tab === 'low-stock' && <LowStockReportTab />}
      {tab === 'expiry' && <ExpiryReportTab />}
    </div>
  );
}
