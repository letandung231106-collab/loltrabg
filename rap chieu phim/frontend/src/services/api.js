const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to build clean query strings without undefined/null/empty values
 */
function buildQueryString(params = {}) {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      cleanParams[key] = value;
    }
  }
  const query = new URLSearchParams(cleanParams).toString();
  return query ? `?${query}` : '';
}

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
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),

  // Movies
  getMovies: (params = {}) => request(`/movies${buildQueryString(params)}`),
  getMovieById: (id) => request(`/movies/${id}`),
  getMovieReviews: (id) => request(`/movies/${id}/reviews`),
  addMovieReview: (id, data) => request(`/movies/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  createMovie: (data) => request('/movies', { method: 'POST', body: JSON.stringify(data) }),
  updateMovie: (id, data) => request(`/movies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: () => request('/rooms'),
  getRoomById: (id) => request(`/rooms/${id}`),
  updateRoomStatus: (id, status, description) =>
    request(`/rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, description }) }),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),

  // Schedules
  getSchedules: (params = {}) => request(`/schedules${buildQueryString(params)}`),
  getScheduleSeatMap: (id) => request(`/schedules/${id}/seats`),
  createSchedule: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  getAllTickets: (params = {}) => request(`/tickets${buildQueryString(params)}`),
  getMyTickets: () => request('/tickets/my-tickets'),
  getTicketById: (id) => request(`/tickets/${id}`),
  verifyTicket: (ticket_code) =>
    request('/tickets/verify', { method: 'POST', body: JSON.stringify({ ticket_code }) }),
  verifyTicketQr: (ticket_code) =>
    request('/tickets/verify', { method: 'POST', body: JSON.stringify({ ticket_code }) }),
  cancelTicket: (id, reason) =>
    request(`/tickets/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Dashboard & Analytics
  getDashboardSummary: () => request('/dashboard/summary'),
  getRevenueAnalytics: () => request('/dashboard/analytics'),

  // Equipment & Maintenance
  getEquipment: (params = {}) => request(`/equipment${buildQueryString(params)}`),
  getEquipmentById: (id) => request(`/equipment/${id}`),
  createEquipment: (data) => request('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id, data) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMaintenanceAlerts: () => request('/equipment/maintenance-alerts'),
  getEquipmentTypes: () => request('/equipment/types'),
  getMaintenances: (params = {}) => request(`/maintenances${buildQueryString(params)}`),
  createMaintenance: (data) =>
    request('/maintenances', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, data) =>
    request(`/maintenances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Incidents
  getIncidents: (params = {}) => request(`/incidents${buildQueryString(params)}`),
  getIncidentById: (id) => request(`/incidents/${id}`),
  createIncident: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  assignTechnician: (id, technician_id) =>
    request(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify({ technician_id }) }),
  resolveIncident: (id, data) => request(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
  closeIncident: (id, note) => request(`/incidents/${id}/close`, { method: 'POST', body: JSON.stringify({ note }) }),

  // Inspections
  getInspections: (params = {}) => request(`/inspections${buildQueryString(params)}`),
  getInspectionById: (id) => request(`/inspections/${id}`),
  createInspection: (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) }),
  submitInspection: (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) }),

  // Shifts & Staff
  getShifts: (params = {}) => request(`/shifts${buildQueryString(params)}`),
  createShift: (data) => request('/shifts', { method: 'POST', body: JSON.stringify(data) }),
  updateShiftStatus: (id, status) =>
    request(`/shifts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  checkInShift: (id, status) =>
    request(`/shifts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getHandovers: () => request('/handovers'),
  createHandover: (data) => request('/handovers', { method: 'POST', body: JSON.stringify(data) }),
  approveHandover: (id, data = {}) => request(`/handovers/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  getShiftHandovers: () => request('/handovers'),
  createShiftHandover: (data) => request('/handovers', { method: 'POST', body: JSON.stringify(data) }),
  approveShiftHandover: (id, status, notes) =>
    request(`/handovers/${id}/approve`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  getEmployees: (params = {}) => request(`/employees${buildQueryString(params)}`),
  getTechnicians: () => request('/employees/technicians'),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers (CRM)
  getCustomers: (params = {}) => request(`/customers${buildQueryString(params)}`),
  getCustomerById: (id) => request(`/customers/${id}`),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCustomerMembership: (id, membership_level) =>
    request(`/customers/${id}/membership`, { method: 'PUT', body: JSON.stringify({ membership_level }) }),

  // Concessions (F&B) & Inventory
  getConcessions: (params = {}) => request(`/concessions${buildQueryString(params)}`),
  createConcession: (data) => request('/concessions', { method: 'POST', body: JSON.stringify(data) }),
  updateConcession: (id, data) => request(`/concessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConcession: (id) => request(`/concessions/${id}`, { method: 'DELETE' }),
  sellConcessions: (orderData) => request('/concessions/sell', { method: 'POST', body: JSON.stringify(orderData) }),
  sellConcessionOrder: (orderData) => request('/concessions/sell', { method: 'POST', body: JSON.stringify(orderData) }),
  getInventory: () => request('/inventory/ingredients'),
  getIngredients: () => request('/inventory/ingredients'),
  createIngredient: (data) => request('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryLogs: () => request('/inventory/logs'),
  createInventoryLog: (data) => request('/inventory/logs', { method: 'POST', body: JSON.stringify(data) }),
  importInventory: (data) => request('/inventory/logs', { method: 'POST', body: JSON.stringify(data) }),

  // KDM & Projector Lamps
  getKdmLicenses: () => request('/kdm/licenses'),
  createKdmLicense: (data) => request('/kdm/licenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteKdmLicense: (id) => request(`/kdm/licenses/${id}`, { method: 'DELETE' }),
  getProjectorLamps: () => request('/kdm/lamps'),
  updateProjectorLamp: (id, data) => request(`/kdm/lamps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Turnaround Quick Clean
  getTurnaroundChecklists: (params = {}) => request(`/turnaround${buildQueryString(params)}`),
  submitTurnaround: (data) => request('/turnaround', { method: 'POST', body: JSON.stringify(data) }),
  createTurnaroundChecklist: (data) => request('/turnaround', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // Chatbot Assistant (CinemaBot AI)
  sendChatMessage: (message, options = {}) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
      signal: options.signal,
    }),
};
