const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcrypt');
const { pool } = require('../../src/config/database');
const { normalizeUserEmail, requiresUniqueEmail, mapEmailDuplicateError } = require('../../src/utils/userEmail');
const { validateUserCreate, validateUserUpdate } = require('../../src/validators/administration.validator');
const { validateProfileUpdate } = require('../../src/validators/profile.validator');
const users = require('../../src/repositories/user.repository');
const profiles = require('../../src/repositories/profile.repository');
const departments = require('../../src/repositories/department.repository');
const userService = require('../../src/services/user.service');
const profileService = require('../../src/services/profile.service');
const passwords = require('../../src/repositories/password.repository');
const emailService = require('../../src/services/email.service');
const passwordService = require('../../src/services/password.service');
const { validateForgotPasswordRequest } = require('../../src/validators/password.validator');
const { authorizeAnyPermission } = require('../../src/middlewares/authorizePermissions');

const identity = { name: 'User', username: 'user', departmentId: 1, initialPassword: 'pass', status: 'Active' };
const duplicate = (key) => Object.assign(new Error(`Duplicate entry 'value' for key 'users.${key}'`), { code: 'ER_DUP_ENTRY' });

test('optional email validation, services and unchanged recovery with no database access', async (t) => {
  for (const method of ['execute', 'query', 'getConnection']) {
    t.mock.method(pool, method, () => { throw new Error('Database access forbidden in unit tests'); });
  }
  t.mock.method(bcrypt, 'hash', async () => 'test-hash');
  t.mock.method(departments, 'findDepartmentById', async () => ({ id: 1, name: 'Department', status: 'Active' }));
  t.mock.method(users, 'findLeastPrivilegedActiveRole', async () => ({ id: 5, isActive: true }));
  t.mock.method(users, 'findUserById', async () => ({ id: 1, username: 'user' }));
  t.mock.method(users, 'findUserByUsername', async () => null);
  t.mock.method(users, 'findUserByEmail', async () => null);
  t.mock.method(users, 'createUserWithCredential', async ({ user }) => user);
  t.mock.method(users, 'updateUser', async ({ user }) => user);
  t.mock.method(profiles, 'findUserByEmail', async () => null);
  t.mock.method(profiles, 'updateCurrentUserProfile', async (payload) => payload);

  for (const email of [undefined, null, '', ' \t\n ']) {
    await t.test(`all validators normalize ${JSON.stringify(email)} to NULL`, () => {
      for (const validate of [validateUserCreate, validateUserUpdate, validateProfileUpdate]) {
        const result = validate({ ...identity, email });
        assert.equal(result.isValid, true);
        assert.equal(result.value.email, null);
      }
    });
  }
  await t.test('all validators reject invalid email and preserve other field validation', () => {
    for (const validate of [validateUserCreate, validateUserUpdate, validateProfileUpdate]) {
      assert.equal(validate({ ...identity, email: 'invalid' }).errors[0].field, 'email');
      assert.equal(validate({ ...identity, email: '', name: '' }).isValid, false);
    }
    assert.equal(validateUserCreate({ ...identity, email: '', initialPassword: '' }).isValid, false);
  });

  const operations = {
    create: (email) => userService.createUser({ ...identity, fullName: 'User', email }),
    edit: (email) => userService.updateUser({ actorUserId: 2, userId: 1, payload: { ...identity, fullName: 'User', email } }),
    profile: async (email) => (await profileService.updateCurrentProfile({ userId: 1, payload: { fullName: 'User', email } })).user,
  };
  for (const [name, run] of Object.entries(operations)) {
    await t.test(`${name}: empty, new ordinary and exact shared emails`, async () => {
      for (const input of ['', '  ', ' New@Example.com ', ' WAHYU.TRISNA100@GMAIL.COM ', ' BETA.INT100@GMAIL.COM ']) {
        assert.equal((await run(input)).email, normalizeUserEmail(input));
      }
    });
    await t.test(`${name}: other-user duplicate refused; exact shared emails bypass lookup`, async () => {
      const lookup = name === 'profile' ? profiles.findUserByEmail : users.findUserByEmail;
      lookup.mock.mockImplementation(async () => ({ id: 2 }));
      try {
        await assert.rejects(run('ordinary@example.com'), (error) => error.statusCode === 409 && error.errors[0].field === 'email');
        for (const shared of ['wahyu.trisna100@gmail.com', 'beta.int100@gmail.com']) {
          const count = lookup.mock.callCount();
          await run(shared);
          await run(shared.toUpperCase());
          assert.equal(lookup.mock.callCount(), count);
        }
        assert.equal(requiresUniqueEmail('béta.int100@gmail.com'), true);
      } finally {
        lookup.mock.mockImplementation(async () => null);
      }
    });
    if (name !== 'create') await t.test(`${name}: own email retained`, async () => {
      const lookup = name === 'profile' ? profiles.findUserByEmail : users.findUserByEmail;
      lookup.mock.mockImplementation(async () => ({ id: 1 }));
      try { await run('own@example.com'); } finally { lookup.mock.mockImplementation(async () => null); }
    });
    await t.test(`${name}: concurrent duplicate-key conflict mapped to email`, async () => {
      const repository = name === 'profile' ? profiles : users;
      const method = name === 'profile' ? 'updateCurrentUserProfile' : name === 'create' ? 'createUserWithCredential' : 'updateUser';
      repository[method].mock.mockImplementation(async () => { throw duplicate('uq_users_email_uniqueness_key'); });
      try {
        await assert.rejects(run('race@example.com'), (error) => error.statusCode === 409 && error.errors[0].field === 'email');
      } finally {
        repository[method].mock.mockImplementation(async (payload) => name === 'profile' ? payload : payload.user);
      }
    });
  }
  await t.test('duplicate mapper does not classify unrelated database errors as email conflicts', () => {
    assert.equal(mapEmailDuplicateError(duplicate('uq_users_username')), null);
    assert.equal(mapEmailDuplicateError(new Error('connection failed')), null);
    assert.equal(mapEmailDuplicateError(duplicate('uq_users_email')).statusCode, 409);
    assert.equal(mapEmailDuplicateError(Object.assign(new Error("Duplicate entry 'uq_users_email_uniqueness_key' for key 'users.uq_users_username'"), { code: 'ER_DUP_ENTRY' })), null);
  });
  await t.test('profile propagates unrelated database failures', async () => {
    const failure = new Error('connection failed');
    profiles.updateCurrentUserProfile.mock.mockImplementation(async () => { throw failure; });
    await assert.rejects(operations.profile('ordinary@example.com'), (error) => error === failure);
  });
  await t.test('authorization middleware still requires administration permission', () => {
    let status;
    const response = { status(code) { status = code; return this; }, json() { return this; } };
    authorizeAnyPermission('user-management.view')({ user: { id: 1 }, permissions: [] }, response, () => assert.fail('Unauthorized mutation'));
    assert.equal(status, 403);
  });

  await t.test('existing recovery matches Username plus shared email and rejects mismatch/NULL', async () => {
    let currentUser;
    const lookedUp = [];
    const issued = [];
    const sent = [];
    t.mock.method(passwords, 'findActiveUserByUsername', async (username) => { lookedUp.push(username); return currentUser; });
    t.mock.method(passwords, 'revokeActiveResetTokensByUserId', async () => {});
    t.mock.method(passwords, 'createResetToken', async (payload) => { issued.push(payload.userId); });
    t.mock.method(emailService, 'sendPasswordReset', async (payload) => { sent.push(payload.username); });
    for (const email of ['wahyu.trisna100@gmail.com', 'beta.int100@gmail.com']) {
      for (const id of [1, 2]) {
        currentUser = { id, username: `user${id}`, email };
        assert.ok((await passwordService.forgotPassword({ username: currentUser.username, registeredEmail: ` ${email.toUpperCase()} ` })).requestId);
      }
    }
    assert.deepEqual(issued, [1, 2, 1, 2]);
    assert.deepEqual(sent, ['user1', 'user2', 'user1', 'user2']);
    for (const email of [null, 'other@example.com']) {
      currentUser = { id: 3, username: 'other', email };
      assert.ok((await passwordService.forgotPassword({ username: 'other', registeredEmail: 'beta.int100@gmail.com' })).requestId);
    }
    assert.equal(issued.length, 4);
    assert.equal(sent.length, 4);
    assert.equal(lookedUp.length, 6);
    assert.equal(validateForgotPasswordRequest({ username: 'other', registeredEmail: '' }).isValid, false);
  });
});
