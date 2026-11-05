const net = require('node:net');
const originalConnect = net.Socket.prototype.connect;
const originalListen = net.Server.prototype.listen;
const originalFetch = globalThis.fetch;
require('./isolatedEmailRegression.cjs');

// Only test-owned ephemeral loopback servers are reachable. The base preload
// still blocks dotenv, DB drivers, R2, email providers and runtime configuration.
const ports = new Set();
net.Server.prototype.listen = function (...args) {
  if (args[0] !== 0 || args[1] !== '127.0.0.1') throw new Error('Only ephemeral loopback test listeners are permitted');
  let port;
  this.once('listening', () => { port = this.address().port; ports.add(port); });
  this.once('close', () => ports.delete(port));
  return originalListen.apply(this, args);
};
net.Socket.prototype.connect = function (...args) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof options === 'object' ? options.host : args[1];
  const port = Number(typeof options === 'object' ? options.port : options);
  if (host !== '127.0.0.1' || !ports.has(port)) throw new Error('Outbound connections are prohibited');
  return originalConnect.apply(this, args);
};
globalThis.fetch = (input, options) => {
  const url = new URL(input);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !ports.has(Number(url.port))) {
    throw new Error('Only test-owned HTTP endpoints are permitted');
  }
  if (options?.redirect && options.redirect !== 'error') throw new Error('HTTP redirects are prohibited');
  return originalFetch(input, { ...options, redirect: 'error' });
};
