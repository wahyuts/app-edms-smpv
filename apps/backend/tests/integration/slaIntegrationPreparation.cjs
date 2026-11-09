const preparation = require('../helpers/slaIntegrationPreparation.cjs');

const dryRun = () => {
  const target = preparation.validateOfflineTarget(preparation.proposedTarget);
  const schema = preparation.buildSchemaInventory();
  const fixtures = preparation.buildFixturePlan('offline0001');
  return {
    mode: 'OFFLINE_PREPARATION_ONLY', target,
    runtimeFacts: Object.fromEntries(preparation.runtimeRequirements.map(key => [key, 'UNVERIFIED'])),
    databaseAccess: 'NOT PERFORMED', sqlExecuted: false, mutationAuthorized: false,
    schema, fixtures: { users: fixtures.users.length, projects: fixtures.projects.length,
      memberships: fixtures.memberships.length, documents: fixtures.documents.length,
      executionAllowed: fixtures.executionAllowed, excludedNotificationRoles: fixtures.excludedNotificationRoles },
    verdict: 'OFFLINE PREPARATION PASS - RUNTIME EXECUTION DISABLED',
  };
};

const main = (args) => {
  if (args.length !== 1 || args[0] !== '--dry-run') {
    throw Object.assign(new Error('Only --dry-run is supported; database execution is not authorized'),
      { code: 'SLA_TEST_OFFLINE_ONLY' });
  }
  return dryRun();
};

if (require.main === module) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(error.code || 'SLA_TEST_PREPARATION_FAILED'); process.exitCode = 1; }
}

module.exports = { dryRun, main };
