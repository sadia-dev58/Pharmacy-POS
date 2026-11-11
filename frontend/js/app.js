const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pos', label: 'Sales (POS)' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'categories', label: 'Categories' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'payments', label: 'Payments' },
  { key: 'sales', label: 'Sales History' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'report-generator', label: 'Report Generator' },
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Settings' },
];

/**
 * Role-based access: which nav pages each role can see.
 * - Admin: everything
 * - Manager: everything except Users and Settings (business config stays admin-only)
 * - Cashier: billing-focused - POS, Sales History, Returns, and Customers only
 */
const ROLE_PERMISSIONS = {
  Admin: NAV_ITEMS.map((i) => i.key),
  Manager: ['dashboard', 'pos', 'inventory', 'medicines', 'categories', 'customers', 'suppliers', 'purchases', 'payments', 'sales', 'returns', 'report-generator'],
  Cashier: ['dashboard', 'pos', 'sales', 'returns', 'customers'],
};

function allowedPages(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Cashier;
}

function Sidebar({ active, onNav, user, onLogout }) {
  const settings = useSettings();
  const allowed = allowedPages(user.role);
  const visibleItems = NAV_ITEMS.filter((item) => allowed.includes(item.key));

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <PharmacyMark size={36} logoUrl={settings.pharmacy_logo} />
        <div className="sidebar-brand-text">
          <strong>{settings.pharmacy_name}</strong>
          <span>POS SYSTEM</span>
        </div>
      </div>

      {visibleItems.map((item) => (
        <div key={item.key} className={`nav-item ${active === item.key ? 'active' : ''}`} onClick={() => onNav(item.key)}>
          <span className="dot"></span>{item.label}
        </div>
      ))}

      <div className="sidebar-footer">
        Signed in as <strong style={{ color: '#fff' }}>{user.full_name}</strong>
        {user.role && <div style={{ marginTop: 2 }}><RoleBadge role={user.role} /></div>}
        <div className="logout" onClick={onLogout}>Log out</div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState(() => {
    const saved = sessionStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = React.useState('dashboard');

  function handleLogin(u) {
    setUser(u);
    sessionStorage.setItem('pos_user', JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem('pos_user');
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Safety net: if the current page isn't allowed for this role (e.g. a
  // Cashier's session had an old page selected), fall back to Dashboard,
  // which every role can access.
  const allowed = allowedPages(user.role);
  const effectivePage = allowed.includes(page) ? page : 'dashboard';

  let content;
  switch (effectivePage) {
    case 'pos': content = <POS />; break;
    case 'inventory': content = <Inventory />; break;
    case 'medicines': content = <Medicines />; break;
    case 'categories': content = <Categories />; break;
    case 'customers': content = <Customers />; break;
    case 'suppliers': content = <Suppliers />; break;
    case 'purchases': content = <Purchases />; break;
    case 'payments': content = <Payments />; break;
    case 'sales': content = <Sales />; break;
    case 'returns': content = <Returns />; break;
    case 'report-generator': content = <ReportGenerator />; break;
    case 'users': content = <Users currentUser={user} />; break;
    case 'settings': content = <Settings currentUser={user} />; break;
    default: content = <Dashboard goTo={setPage} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={effectivePage} onNav={setPage} user={user} onLogout={handleLogout} />
      <div className="main-area">{content}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
