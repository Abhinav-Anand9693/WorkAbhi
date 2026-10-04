import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const source = join(process.cwd(), 'node_modules', '@standardagents', 'sip', 'dist');
const destination = join(process.cwd(), 'public', 'workabhi-codecs', 'sip');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of ['index.js', 'index.d.ts', 'sip.js', 'sip.wasm']) {
  await cp(join(source, file), join(destination, file));
}
console.log('Prepared WorkAbhi SIP codec assets.');
