const ROLE_DESCRIPTIONS = {
  Admin: 'Full access to everything, including Users and Settings.',
  Manager: 'Everything except Users and Settings.',
  Cashier: 'Point of Sale, Sales History, Returns, and Customers only.',
};

function RoleBadge({ role }) {
  const cls = role === 'Admin' ? 'ok' : role === 'Manager' ? 'warn' : 'low';
  return <span className={`badge ${cls}`}>{role || 'Cashier'}</span>;
}

function UserFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const isEdit = !!initial.user_id;

  function set(f, v) { setForm((s) => ({ ...s, [f]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('Full name is required'); return; }
    if (!isEdit && (!form.username || !form.password)) { setError('Username and password are required'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.updateUser(form); else await api.createUser(form);
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{isEdit ? 'Edit user' : 'Add user'}</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="login-error">{error}</div>}
            <div className="field"><label>Full name *</label><input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} autoFocus /></div>
            {!isEdit && (
              <div className="field"><label>Username *</label><input value={form.username || ''} onChange={(e) => set('username', e.target.value)} /></div>
            )}
            <div className="field-row">
              <div className="field"><label>Email</label><input value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role || 'Cashier'} onChange={(e) => set('role', e.target.value)}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
              </select>
              <div className="text-muted" style={{ fontSize: 11.5, marginTop: 5 }}>{ROLE_DESCRIPTIONS[form.role || 'Cashier']}</div>
            </div>
            <div className="field">
              <label>{isEdit ? 'New password (leave blank to keep current)' : 'Password *'}</label>
              <input type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save user'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Users({ currentUser }) {
  const [users, setUsers] = React.useState([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  function reload() { api.getUsers().then(setUsers).catch(() => {}); }
  React.useEffect(reload, []);

  async function handleDelete(id) {
    if (!confirm('Delete this user account?')) return;
    try { await api.deleteUser(id); reload(); } catch (err) { alert(err.message); }
  }

  if (currentUser && currentUser.role && currentUser.role !== 'Admin') {
    return (
      <div>
        <div className="topbar"><div><h1>Users</h1></div></div>
        <div className="empty-state">Only Admin accounts can manage users.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div><h1>Users</h1><div className="topbar-sub">{users.length} staff accounts</div></div>
        <button className="btn btn-primary" onClick={() => { setEditing({ full_name: '', username: '', email: '', phone: '', role: 'Cashier', password: '' }); setFormOpen(true); }}>+ Add user</button>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Email</th><th>Phone</th><th>Since</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={u.full_name} size={30} /><strong>{u.full_name}</strong>{u.username === currentUser?.username && <span className="badge ok" style={{ marginLeft: 6 }}>You</span>}</div></td>
                <td className="mono">{u.username}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>{u.email || '—'}</td>
                <td className="mono">{u.phone || '—'}</td>
                <td className="text-muted">{u.created_at ? String(u.created_at).slice(0, 10) : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditing({ ...u, password: '' }); setFormOpen(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.user_id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="7"><div className="empty-state">No users found</div></td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && <UserFormModal initial={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />}
    </div>
  );
}
