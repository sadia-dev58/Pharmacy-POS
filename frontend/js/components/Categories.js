function Categories() {
  const [categories, setCategories] = React.useState([]);
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function reload() { api.getCategories().then(setCategories).catch(() => {}); }
  React.useEffect(reload, []);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createCategory({ category_name: name, description: desc });
      setName(''); setDesc('');
      reload();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="topbar"><div><h1>Categories</h1><div className="topbar-sub">{categories.length} categories</div></div></div>

      <div className="two-col">
        <div className="card">
          <div className="section-title">All categories</div>
          <table>
            <thead><tr><th>Name</th><th>Description</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id}><td><strong>{c.category_name}</strong></td><td className="text-muted">{c.description || '—'}</td></tr>
              ))}
              {categories.length === 0 && <tr><td colSpan="2"><div className="empty-state">No categories yet</div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">Add category</div>
          <form onSubmit={submit}>
            {error && <div className="login-error">{error}</div>}
            <div className="field"><label>Name *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Description</label><textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea></div>
            <button className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>{saving ? 'Saving…' : 'Add category'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
