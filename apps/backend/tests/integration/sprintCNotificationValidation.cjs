// Reuse the hardened isolated runner, fixtures, safety gates and all 30 Sprint B assertions.
process.argv.push('--sprint-c-notifications');
require('./sprintBDatabaseValidation.cjs');
