/**
 * useSettings
 * Shared hook that loads pharmacy settings (name, address, logo, etc.)
 * once per component. Used by the Sidebar, Login screen, and Receipt so
 * a custom logo/name uploaded in Settings shows up everywhere.
 */
const DEFAULT_PHARMACY_INFO = {
  pharmacy_name: 'Medicare Pharmacy',
  pharmacy_address: '12-B Model Town Link Road, Lahore',
  pharmacy_phone: '+92 300 1234567',
  pharmacy_email: 'care@medicarepharmacy.pk',
  pharmacy_logo: '',
  receipt_footer: 'Thank you — get well soon!',
};

function useSettings() {
  const [settings, setSettings] = React.useState(DEFAULT_PHARMACY_INFO);
  React.useEffect(() => {
    api.getSettings().then((s) => setSettings({ ...DEFAULT_PHARMACY_INFO, ...s })).catch(() => {});
  }, []);
  return settings;
}

/**
 * Avatar
 * Colored initials circle, used to make list pages (Customers, Suppliers,
 * Users) feel more modern than plain text rows. Color is derived
 * deterministically from the name so the same person/company always gets
 * the same color.
 */
const AVATAR_PALETTE = ['#1B4B8A', '#2E6199', '#3E7FC1', '#7FA8DC', '#E0821E', '#1E7A54'];

function Avatar({ name, size = 34 }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const color = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4,
    }}>
      {initials || '?'}
    </div>
  );
}
/**
 * PharmacyMark
 * The app's logo mark. Shows the uploaded pharmacy logo (from Settings) if
 * one is set, otherwise falls back to a clean, modern SVG mark (a medical
 * cross with a pill accent) - no more plain "Rx" text.
 */
function PharmacyMark({ size = 44, logoUrl, rounded = true }) {
  const gradId = React.useId().replace(/:/g, '');

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Pharmacy logo"
        style={{ width: size, height: size, borderRadius: rounded ? size * 0.28 : 0, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`mark-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E6199" />
          <stop offset="100%" stopColor="#0E2C54" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx={rounded ? 13 : 0} fill={`url(#mark-${gradId})`} />
      <rect x="20" y="9" width="8" height="30" rx="2.5" fill="#fff" />
      <rect x="9" y="20" width="30" height="8" rx="2.5" fill="#fff" />
      <circle cx="36.5" cy="11.5" r="6" fill="#E0821E" />
    </svg>
  );
}
