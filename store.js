// Simple in-memory store shared across routes
// Replace with real database queries when ready

const store = {
  responses: [],
  events:    [],
  users: [
    { id: 'usr-001', name: 'SparksLab Admin', email: 'admin@sparkslab.ae', role: 'sparkslab', lastLogin: new Date().toISOString() },
    { id: 'usr-002', name: 'HR Manager',      email: 'hr@adnec.ae',        role: 'client',    lastLogin: null },
  ],
}

module.exports = store