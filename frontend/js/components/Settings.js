/** Resize + compress an uploaded image client-side so it comfortably fits
 * in a database TEXT/LONGTEXT column as a base64 data URI. */
function fileToCompressedDataUrl(file, maxSize = 180, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read the image'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Settings({ currentUser }) {
  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');
  const [logoError, setLogoError] = React.useState('');

  React.useEffect(() => {
    api.getSettings().then(setForm).catch((e) => setError(e.message));
  }, []);

  if (currentUser && currentUser.role && currentUser.role !== 'Admin') {
    return (
      <div>
        <div className="topbar"><div><h1>Settings</h1></div></div>
        <div className="empty-state">Only Admin accounts can change pharmacy settings.</div>
      </div>
    );
  }

  function set(f, v) { setForm((s) => ({ ...s, [f]: v })); setSaved(false); }

  async function handleLogoSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) { setLogoError('Please choose an image file'); return; }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      set('pharmacy_logo', dataUrl);
    } catch (err) {
      setLogoError(err.message);
    }
  }

  function removeLogo() {
    set('pharmacy_logo', '');
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.saveSettings(form);
      setSaved(true);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  if (error) return <div className="empty-state">{error}</div>;
  if (!form) return <div className="loading-spin"></div>;

  return (
    <div>
      <div className="topbar"><div><h1>Settings</h1><div className="topbar-sub">Pharmacy details used across receipts, invoices, and the sidebar</div></div></div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={submit}>
          {error && <div className="login-error">{error}</div>}
          {saved && <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '9px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 12 }}>Settings saved</div>}

          <div className="field">
            <label>Pharmacy logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="settings-logo-preview">
                {form.pharmacy_logo
                  ? <img src={form.pharmacy_logo} alt="Pharmacy logo" />
                  : <PharmacyMark size={56} logoUrl="" />}
              </div>
              <div>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  Upload logo
                  <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
                </label>
                {form.pharmacy_logo && (
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 8 }} onClick={removeLogo}>Remove</button>
                )}
                {logoError && <div style={{ color: 'var(--color-danger)', fontSize: 11.5, marginTop: 6 }}>{logoError}</div>}
                {!logoError && <div className="text-muted" style={{ fontSize: 11.5, marginTop: 6 }}>PNG or JPG — shown on the sidebar, login screen, and receipts</div>}
              </div>
            </div>
          </div>

          <div className="field"><label>Pharmacy name</label><input value={form.pharmacy_name} onChange={(e) => set('pharmacy_name', e.target.value)} /></div>
          <div className="field"><label>Address</label><input value={form.pharmacy_address} onChange={(e) => set('pharmacy_address', e.target.value)} /></div>
          <div className="field-row">
            <div className="field"><label>Phone</label><input value={form.pharmacy_phone} onChange={(e) => set('pharmacy_phone', e.target.value)} /></div>
            <div className="field"><label>Email</label><input value={form.pharmacy_email} onChange={(e) => set('pharmacy_email', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Default tax rate (%)</label><input type="number" step="0.01" value={form.default_tax_rate} onChange={(e) => set('default_tax_rate', e.target.value)} /></div>
            <div className="field"><label>Currency symbol</label><input value={form.currency_symbol} onChange={(e) => set('currency_symbol', e.target.value)} /></div>
          </div>
          <div className="field"><label>Receipt footer message</label><input value={form.receipt_footer} onChange={(e) => set('receipt_footer', e.target.value)} /></div>

          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </form>
      </div>
    </div>
  );
}
