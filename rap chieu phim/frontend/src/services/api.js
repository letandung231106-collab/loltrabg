const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch wrapper có tự động đính kèm JWT Bearer Token
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Lỗi yêu cầu (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  switchRole: (targetRole) => request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ targetRole }) }),

  // Movies
  getMovies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/movies${query ? `?${query}` : ''}`);
  },
  getMovieById: (id) => request(`/movies/${id}`),
  createMovie: (data) => request('/movies', { method: 'POST', body: JSON.stringify(data) }),
  updateMovie: (id, data) => request(`/movies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: () => request('/rooms'),
  getRoomById: (id) => request(`/rooms/${id}`),
  updateRoomStatus: (id, status, description) =>
    request(`/rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, description }) }),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),

  // Schedules
  getSchedules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/schedules${query ? `?${query}` : ''}`);
  },
  getScheduleSeatMap: (id) => request(`/schedules/${id}/seats`),
  createSchedule: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  cancelSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),

  // Bookings & Hold Seats
  holdSeats: (screening_id, seat_ids) =>
    request('/bookings/hold', { method: 'POST', body: JSON.stringify({ screening_id, seat_ids }) }),
  releaseSeatHold: (booking_id) =>
    request('/bookings/release', { method: 'POST', body: JSON.stringify({ booking_id }) }),
  getMyBookings: () => request('/bookings/my-bookings'),
  getBookingById: (id) => request(`/bookings/${id}`),

  // Payments & Tickets
  processPayment: (paymentData) => request('/payments/process', { method: 'POST', body: JSON.stringify(paymentData) }),
  createMomoPayment: (data) => request('/payments/momo/create', { method: 'POST', body: JSON.stringify(data) }),
  verifyMomoReturn: (data) => request('/payments/momo/momo-return', { method: 'POST', body: JSON.stringify(data) }),
  getAllTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tickets${query ? `?${query}` : ''}`);
  },
  getMyTickets: () => request('/tickets/my-tickets'),
  verifyTicket: (ticket_code) => request('/tickets/verify', { method: 'POST', body: JSON.stringify({ ticket_code }) }),
  cancelTicket: (id) => request(`/tickets/${id}/cancel`, { method: 'POST' }),

  // Equipment
  getEquipment: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/equipment${query ? `?${query}` : ''}`);
  },
  getEquipmentTypes: () => request('/equipment/types'),
  getMaintenanceAlerts: () => request('/equipment/alerts'),
  createEquipment: (data) => request('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id, data) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents${query ? `?${query}` : ''}`);
  },
  getIncidentById: (id) => request(`/incidents/${id}`),
  createIncident: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  assignTechnician: (id, technician_id) =>
    request(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify({ technician_id }) }),
  resolveIncident: (id, data) => request(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
  closeIncident: (id, note) => request(`/incidents/${id}/close`, { method: 'POST', body: JSON.stringify({ note }) }),

  // Maintenances
  getMaintenances: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/maintenances${query ? `?${query}` : ''}`);
  },
  createMaintenance: (data) => request('/maintenances', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, data) => request(`/maintenances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Room Inspections (Checklists)
  getInspections: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inspections${query ? `?${query}` : ''}`);
  },
  getInspectionById: (id) => request(`/inspections/${id}`),
  submitInspection: (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) }),

  // Shifts
  getShifts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shifts${query ? `?${query}` : ''}`);
  },
  createShift: (data) => request('/shifts', { method: 'POST', body: JSON.stringify(data) }),
  checkInShift: (id, status) => request(`/shifts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Employees & Customers
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ''}`);
  },
  getTechnicians: () => request('/employees/technicians'),
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomerById: (id) => request(`/customers/${id}`),

  // Dashboard & Notifications
  getDashboardSummary: () => request('/dashboard/summary'),
  getRevenueAnalytics: () => request('/dashboard/analytics'),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // Concessions & F&B
  getConcessions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/concessions${query ? `?${query}` : ''}`);
  },
  createConcession: (data) => request('/concessions', { method: 'POST', body: JSON.stringify(data) }),
  updateConcession: (id, data) => request(`/concessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConcession: (id) => request(`/concessions/${id}`, { method: 'DELETE' }),
  sellConcessionOrder: (data) => request('/concessions/sell', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory Ingredients & Logs
  getIngredients: () => request('/inventory/ingredients'),
  createIngredient: (data) => request('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryLogs: () => request('/inventory/logs'),
  createInventoryLog: (data) => request('/inventory/logs', { method: 'POST', body: JSON.stringify(data) }),

  // Cash Handover & Shift Float
  getHandovers: () => request('/handovers'),
  createHandover: (data) => request('/handovers', { method: 'POST', body: JSON.stringify(data) }),
  approveHandover: (id, data) => request(`/handovers/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),

  // KDM & Projector Lamps
  getKdmLicenses: () => request('/kdm/licenses'),
  createKdmLicense: (data) => request('/kdm/licenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteKdmLicense: (id) => request(`/kdm/licenses/${id}`, { method: 'DELETE' }),
  getProjectorLamps: () => request('/kdm/lamps'),
  updateProjectorLamp: (id, data) => request(`/kdm/lamps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Turnaround Cleaning Checklist
  getTurnaroundChecklists: () => request('/turnaround'),
  submitTurnaround: (data) => request('/turnaround', { method: 'POST', body: JSON.stringify(data) }),
};
