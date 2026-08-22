const storageService = require('../src/services/storage.service');

const main = async () => {
  await storageService.initializeStorage();
  const result = await storageService.runStorageSmokeValidation();
  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error(JSON.stringify({
    code: error.code,
    message: error.message,
    name: error.name,
    status: 'FAIL',
  }, null, 2));
  process.exitCode = 1;
});
