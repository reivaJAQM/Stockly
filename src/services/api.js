const API_BASE = '/api';

export const api = {
  // Dashboard & Stats
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Error al obtener configuración');
    return res.json();
  },

  async updateSettings(settingsData) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) throw new Error('Error al actualizar configuración');
    return res.json();
  },

  // Products
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },

  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Error al crear producto');
    return res.json();
  },

  async updateProduct(id, productData) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Error al actualizar producto');
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
    return res.json();
  },

  async adjustStock(id, amount, reason) {
    const res = await fetch(`${API_BASE}/products/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reason })
    });
    if (!res.ok) throw new Error('Error al ajustar existencias');
    return res.json();
  },

  // Sales
  async getSales() {
    const res = await fetch(`${API_BASE}/sales`);
    if (!res.ok) throw new Error('Error al obtener ventas');
    return res.json();
  },

  async createSale(saleData) {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) throw new Error('Error al registrar venta');
    return res.json();
  },

  async updateOrderStatus(id, status) {
    const res = await fetch(`${API_BASE}/sales/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Error al actualizar estado de orden');
    return res.json();
  },

  async addPaymentToOrder(id, paymentData) {
    const res = await fetch(`${API_BASE}/sales/${encodeURIComponent(id)}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar abono');
    }
    return res.json();
  },

  async deleteSale(id) {
    const res = await fetch(`${API_BASE}/sales/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar orden');
    return res.json();
  },

  // Expenses
  async getExpenses() {
    const res = await fetch(`${API_BASE}/expenses`);
    if (!res.ok) throw new Error('Error al obtener gastos');
    return res.json();
  },

  async createExpense(expenseData) {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    if (!res.ok) throw new Error('Error al registrar gasto');
    return res.json();
  },

  async deleteExpense(id) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar gasto');
    return res.json();
  },

  // Customers
  async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Error al obtener clientes');
    return res.json();
  },

  async createCustomer(customerData) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!res.ok) throw new Error('Error al registrar cliente');
    return res.json();
  },

  async updateCustomer(id, customerData) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!res.ok) throw new Error('Error al actualizar cliente');
    return res.json();
  },

  async deleteCustomer(id) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar cliente');
    return res.json();
  },

  // Categories (PostgreSQL)
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Error al obtener categorías');
    return res.json();
  },

  async createCategory(categoryData) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) throw new Error('Error al crear categoría');
    return res.json();
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar categoría');
    return res.json();
  },

  // Services (Servicios digitales sin inventario)
  async getServices() {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Error al obtener servicios');
    return res.json();
  },

  async createService(serviceData) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    if (!res.ok) throw new Error('Error al registrar servicio');
    return res.json();
  },

  async updateService(id, serviceData) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    if (!res.ok) throw new Error('Error al actualizar servicio');
    return res.json();
  },

  async deleteService(id) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar servicio');
    return res.json();
  }
};
