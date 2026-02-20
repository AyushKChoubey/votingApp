/**
 * serviceHealth.js
 * Tracks initialization status of critical backend services.
 * Other modules call setStatus() during startup; the API health endpoint reads this.
 */

const services = {
  email: { ok: true, label: "Email service" },
  cloudinary: { ok: true, label: "Avatar & image uploads" },
};

/**
 * @param {'email'|'cloudinary'} name
 * @param {boolean} ok
 */
const setStatus = (name, ok) => {
  if (services[name]) {
    services[name].ok = ok;
  }
};

/** Returns a snapshot of all service statuses */
const getAll = () =>
  Object.entries(services).map(([key, { ok, label }]) => ({ key, ok, label }));

/** True if every service is healthy */
const allHealthy = () => Object.values(services).every((s) => s.ok);

module.exports = { setStatus, getAll, allHealthy };
