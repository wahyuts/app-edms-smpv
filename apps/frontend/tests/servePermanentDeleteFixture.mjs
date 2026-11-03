import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const mock = fileURLToPath(new URL('./fixtures/permanent-delete/mocks.js', import.meta.url));
const root = fileURLToPath(new URL('./fixtures/permanent-delete/', import.meta.url));
const server = await createServer({ configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)), root,
  resolve: { alias: [
    { find: /^@\/shared\/api$/, replacement: mock }, { find: /^@\/shared\/components\/toast$/, replacement: mock },
    { find: /^@\/shared\/hooks\/usePermission$/, replacement: mock },
    { find: /^@\/features\/auth\/services\/auth.service$/, replacement: mock },
    { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
  ] }, server: { host: '127.0.0.1', port: 5179, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] } } });
await server.listen(); server.printUrls();
