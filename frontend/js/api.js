/**
 * Thin fetch wrapper around the PHP backend.
 *
 * API_BASE is computed RELATIVE to wherever frontend/index.html was actually
 * loaded from, so it does not matter what you name the project folder in
 * htdocs (pos, pharmacy-pos, whatever) — it always resolves to "../backend/api"
 * next to the frontend folder. This is what makes it read YOUR live database
 * instead of falling back to a wrong/hardcoded path.
 */
const API_BASE = new URL('../backend/api/', window.location.href).href;

async function apiRequest(endpoint, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    throw new Error(`Cannot reach backend at ${url}. Is Apache/MySQL running, and is the "backend" folder next to "frontend"?`);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.error) ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  // auth
  login: (username, password) => apiRequest('auth.php', { method: 'POST', body: { username, password } }),

  // medicines
  getMedicines: () => apiRequest('medicines.php'),
  searchMedicines: (q) => apiRequest('medicines.php', { params: { search: q } }),
  getMedicineByBarcode: (barcode) => apiRequest('medicines.php', { params: { barcode } }),
  createMedicine: (data) => apiRequest('medicines.php', { method: 'POST', body: data }),
  updateMedicine: (data) => apiRequest('medicines.php', { method: 'PUT', body: data }),
  deleteMedicine: (id) => apiRequest('medicines.php', { method: 'DELETE', params: { id } }),

  // stock / inventory
  getAllStock: () => apiRequest('stock.php', { params: { all: 1 } }),
  getStockHistory: (medicineId) => apiRequest('stock.php', { params: { medicine_id: medicineId } }),
  addStock: (data) => apiRequest('stock.php', { method: 'POST', body: data }),

  // categories
  getCategories: () => apiRequest('categories.php'),
  createCategory: (data) => apiRequest('categories.php', { method: 'POST', body: data }),
  updateCategory: (data) => apiRequest('categories.php', { method: 'PUT', body: data }),
  deleteCategory: (id) => apiRequest('categories.php', { method: 'DELETE', params: { id } }),

  // customers
  getCustomers: () => apiRequest('customers.php'),
  searchCustomers: (q) => apiRequest('customers.php', { params: { search: q } }),
  createCustomer: (data) => apiRequest('customers.php', { method: 'POST', body: data }),
  updateCustomer: (data) => apiRequest('customers.php', { method: 'PUT', body: data }),
  deleteCustomer: (id) => apiRequest('customers.php', { method: 'DELETE', params: { id } }),

  // suppliers
  getSuppliers: () => apiRequest('suppliers.php'),
  createSupplier: (data) => apiRequest('suppliers.php', { method: 'POST', body: data }),
  updateSupplier: (data) => apiRequest('suppliers.php', { method: 'PUT', body: data }),
  deleteSupplier: (id) => apiRequest('suppliers.php', { method: 'DELETE', params: { id } }),

  // purchases
  getPurchases: () => apiRequest('purchases.php'),
  getPurchase: (id) => apiRequest('purchases.php', { params: { id } }),
  createPurchase: (data) => apiRequest('purchases.php', { method: 'POST', body: data }),

  // payments
  getPayments: (params) => apiRequest('payments.php', { params }),

  // sales / checkout
  getSales: (params) => apiRequest('sales.php', { params }),
  getSale: (id) => apiRequest('sales.php', { params: { id } }),
  checkout: (data) => apiRequest('sales.php', { method: 'POST', body: data }),

  // returns / refunds
  getReturns: () => apiRequest('returns.php'),
  getReturnableItems: (saleId) => apiRequest('returns.php', { params: { sale_id: saleId } }),
  submitReturn: (data) => apiRequest('returns.php', { method: 'POST', body: data }),

  // dashboard & reports
  getDashboard: () => apiRequest('dashboard.php'),
  getReports: (params) => apiRequest('reports.php', { params }),

  // users
  getUsers: () => apiRequest('users.php'),
  createUser: (data) => apiRequest('users.php', { method: 'POST', body: data }),
  updateUser: (data) => apiRequest('users.php', { method: 'PUT', body: data }),
  deleteUser: (id) => apiRequest('users.php', { method: 'DELETE', params: { id } }),

  // settings
  getSettings: () => apiRequest('settings.php'),
  saveSettings: (data) => apiRequest('settings.php', { method: 'POST', body: data }),
};
