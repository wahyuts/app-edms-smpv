const { closeDatabasePool } = require('../src/config/database');
const temporaryUploadCleanupService = require('../src/services/temporaryUploadCleanup.service');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 100;

  return {
    dryRun: args.includes('--dry-run'),
    limit,
  };
};

const main = async () => {
  const options = parseArgs();
  const result = await temporaryUploadCleanupService.cleanupExpiredTemporaryUploads(options);
  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(JSON.stringify({
      code: error.code,
      message: error.message,
      name: error.name,
      status: 'FAIL',
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool().catch(() => {});
  });
