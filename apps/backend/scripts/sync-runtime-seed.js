const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(backendRoot, '..', '..');
const canonicalSeedPath = path.join(repositoryRoot, 'database', 'seed', 'seed-base.sql');
const runtimeSeedPath = path.join(backendRoot, 'src', 'database', 'seed', 'seed-base.runtime.sql');
const runtimeChecksumPath = `${runtimeSeedPath}.sha256`;
const args = new Set(process.argv.slice(2));

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex');

const exists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const readRuntimeSeed = async () => {
  const [content, checksum] = await Promise.all([
    fs.readFile(runtimeSeedPath),
    fs.readFile(runtimeChecksumPath, 'utf8'),
  ]);

  return {
    checksum: checksum.trim(),
    content,
  };
};

const syncRuntimeSeed = async () => {
  const content = await fs.readFile(canonicalSeedPath);
  const checksum = sha256(content);

  await fs.mkdir(path.dirname(runtimeSeedPath), { recursive: true });
  await fs.writeFile(runtimeSeedPath, content);
  await fs.writeFile(runtimeChecksumPath, `${checksum}\n`);

  return checksum;
};

const verifyRuntimeSeed = async (expectedChecksum = null) => {
  const runtimeSeed = await readRuntimeSeed();
  const actualChecksum = sha256(runtimeSeed.content);
  const targetChecksum = expectedChecksum || runtimeSeed.checksum;

  if (actualChecksum !== runtimeSeed.checksum || actualChecksum !== targetChecksum) {
    throw new Error('[SEED_SYNC] runtime seed artifact checksum mismatch');
  }

  return actualChecksum;
};

const main = async () => {
  const canonicalExists = await exists(canonicalSeedPath);
  let checksum = null;

  if (canonicalExists && (args.has('--sync') || args.has('--sync-if-source-exists'))) {
    checksum = await syncRuntimeSeed();
  }

  if (args.has('--check')) {
    checksum = await verifyRuntimeSeed(checksum);
  }

  console.log(`[SEED_SYNC] runtime seed ready checksum=${checksum || 'not-checked'}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
