function Login({ onLogin }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const settings = useSettings();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="login-blob login-blob-1"></div>
        <div className="login-blob login-blob-2"></div>
        <div className="login-blob login-blob-3"></div>

        <div className="login-float-card card-1">
          <span className="login-float-icon">💊</span>
          <div><strong>500+</strong><span>Medicines tracked</span></div>
        </div>
        <div className="login-float-card card-2">
          <span className="login-float-icon">⚡</span>
          <div><strong>Fast</strong><span>Barcode checkout</span></div>
        </div>
        <div className="login-float-card card-3">
          <span className="login-float-icon">📊</span>
          <div><strong>Live</strong><span>Sales insights</span></div>
        </div>

        <div className="login-hero-content">
          <div className="login-hero-mark-wrap"><PharmacyMark size={52} logoUrl={settings.pharmacy_logo} /></div>
          <h1 className="login-hero-title">Run your pharmacy from one clean screen.</h1>
          <p className="login-hero-sub">
            {settings.pharmacy_name} brings billing, inventory, purchases, and reports
            together — built for the counter, not just the back office.
          </p>

          <div className="login-hero-features">
            <div className="login-hero-feature"><span>📷</span> Camera barcode scanning</div>
            <div className="login-hero-feature"><span>📊</span> Live sales &amp; inventory charts</div>
            <div className="login-hero-feature"><span>🧾</span> Instant printable receipts</div>
            <div className="login-hero-feature"><span>🔔</span> Automatic low-stock alerts</div>
          </div>
        </div>

        <div className="login-hero-quote">
          "From the till to the ledger — everything a pharmacy counter needs, in one place."
        </div>
      </div>

      <div className="login-form-panel">
        <form className="login-form-inner" onSubmit={submit}>
          <div className="login-form-head">
            <span className="login-form-badge">👋 Welcome</span>
            <h2>Welcome back</h2>
            <p className="sub">Sign in to open the register</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="field login-field">
            <label>Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">👤</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
          </div>

          <div className="field login-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <p className="login-hint"></p>
        </form>
      </div>
    </div>
  );
}
