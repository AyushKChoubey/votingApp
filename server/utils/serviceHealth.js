/**
 * serviceHealth.js
 * Tracks initialization status of critical backend services.
 * Other modules call setStatus() during startup; the API health endpoint reads this.
 */

// Default services start as unknown/unhealthy to avoid false-positives
const services = {
  server: { ok: false, label: "Server", message: null, updatedAt: null },
  email: { ok: false, label: "Email service", message: null, updatedAt: null },
  cloudinary: { ok: false, label: "Avatar & image uploads", message: null, updatedAt: null },
};

/**
 * @param {'server'|'email'|'cloudinary'} name
 * @param {boolean} ok
 */
/**
 * Set status for a named service.
 * @param {string} name
 * @param {boolean} ok
 * @param {Object} [meta] - optional metadata: { message }
 */
const setStatus = (name, ok, meta = {}) => {
  if (services[name]) {
    services[name].ok = Boolean(ok);
    services[name].message = meta.message || null;
    services[name].updatedAt = new Date().toISOString();
  }
};

/** Add a new service to the tracker. */
const addService = (name, label, initialOk = false) => {
  if (!services[name]) {
    services[name] = { ok: Boolean(initialOk), label, message: null, updatedAt: null };
  }
};

/** Returns a snapshot of all service statuses */
/** Returns a snapshot of all service statuses (with metadata) */
const getAll = () =>
  Object.entries(services).map(([key, { ok, label, message, updatedAt }]) => ({
    key,
    ok,
    label,
    message: message || null,
    updatedAt: updatedAt || null,
  }));

/** Get a single service entry or null */
const get = (name) => {
  const s = services[name];
  return s ? { key: name, ...s } : null;
};

/** True if every service is healthy */
const allHealthy = () => Object.values(services).every((s) => s.ok === true);

/** Reset all services to unhealthy/unknown state (useful for re-checks) */
const reset = () => {
  Object.keys(services).forEach((k) => {
    services[k].ok = false;
    services[k].message = null;
    services[k].updatedAt = null;
  });
};

module.exports = { setStatus, getAll, allHealthy, get, reset, addService };
