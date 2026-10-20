import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { z } from 'zod';
import * as constants from '../src/features/user-management/constants/user.constants.js';
import { validateProfileForm } from '../src/features/auth/schemas/profile.schema.js';

const synthetic = (exports) => new SyntheticModule(Object.keys(exports), function () {
  for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
});
const load = async (path, imports) => {
  const module = new SourceTextModule(await readFile(new URL(path, import.meta.url), 'utf8'));
  await module.link((specifier) => {
    assert.ok(imports[specifier], `Unexpected import: ${specifier}`);
    return synthetic(imports[specifier]);
  });
  await module.evaluate();
  return module.namespace;
};

test('Create/Edit User: optional email, format, case, whitespace and other required fields', async () => {
  const { createUserSchema, updateUserSchema } = await load('../src/features/user-management/schemas/user.schema.js', {
    zod: { z }, '../constants/user.constants': constants,
  });
  const form = { name: 'User', username: 'user', department: 'No Department', initialPassword: 'pass', confirmPassword: 'pass', status: 'Active' };
  for (const schema of [createUserSchema, updateUserSchema]) {
    for (const email of ['', ' \t ', null, undefined]) assert.equal(schema.parse({ ...form, email }).email, null);
    assert.equal(schema.parse({ ...form, email: ' USER@EXAMPLE.COM ' }).email, 'user@example.com');
    assert.equal(schema.safeParse({ ...form, email: 'invalid' }).success, false);
    assert.equal(schema.safeParse({ ...form, email: '', department: '' }).success, false);
  }
  assert.equal(createUserSchema.safeParse({ ...form, email: '', confirmPassword: 'mismatch' }).success, false);
});

test('Edit Profile: NULL payload, valid normalization, invalid format and required name', () => {
  for (const email of ['', ' \t ', null, undefined]) {
    const result = validateProfileForm({ fullName: ' User ', email });
    assert.equal(result.isValid, true);
    assert.equal(result.value.email, null);
    assert.equal(result.value.fullName, 'User');
  }
  assert.equal(validateProfileForm({ fullName: 'User', email: ' TEST@EXAMPLE.COM ' }).value.email, 'test@example.com');
  assert.equal(validateProfileForm({ fullName: 'User', email: 'invalid' }).errors.email, 'Format email tidak valid.');
  assert.equal(validateProfileForm({ fullName: '', email: '' }).isValid, false);
});

test('User API service preserves NULL payload and duplicate-email field errors', async () => {
  const calls = [];
  let failure;
  const request = async (url, payload) => {
    if (failure) throw failure;
    calls.push({ url, payload });
    return { data: { data: { ...payload, id: 1, status: 'Active' } } };
  };
  const { UserService, UserValidationError } = await load('../src/features/user-management/services/user.service.js', {
    '@/shared/api': { apiClient: { post: request, put: request } },
    '../constants/user.constants': constants,
    './department.service': { DepartmentService: {} },
  });
  await UserService.createUser({ departmentId: 1, name: 'User', username: 'user', initialPassword: 'pass', email: null });
  await UserService.updateUser(1, { departmentId: 1, name: 'User', email: null, status: 'Active' });
  assert.equal(calls[0].payload.email, null);
  assert.equal(calls[1].payload.email, null);
  failure = { response: { data: { message: 'Email sudah digunakan.', errors: [{ field: 'email', message: 'Email sudah digunakan.' }] } } };
  await assert.rejects(UserService.updateUser(1, { departmentId: 1, email: 'duplicate@example.com' }),
    (error) => error instanceof UserValidationError && error.errors[0].field === 'email' && error.message === 'Email sudah digunakan.');
  for (const email of ['', ' WAHYU.TRISNA100@GMAIL.COM ', 'beta.int100@gmail.com']) {
    assert.equal(await UserService.checkEmailUniqueness(email), true);
  }
});

test('existing profile API sends NULL and preserves duplicate-email error details', async () => {
  let payload;
  let failure;
  const { AuthService } = await load('../src/features/auth/services/auth.service.js', {
    '@/shared/api': { apiClient: {
      patch: async (url, data) => {
        assert.equal(url, '/v1/profile');
        if (failure) throw failure;
        payload = data;
        return { data: { success: true, data: { user: { id: 1, email: null } } } };
      },
      get: async () => ({ data: { success: true, data: { user: { id: 1, email: null } } } }),
    } },
    '@/shared/api/query-client': { queryClient: {} },
    '../stores/auth.store': {
      CURRENT_USER_CHANGED_EVENT: 'test-auth',
      getAuthState: () => ({ projectSelectionRequired: false }),
      useAuthStore: { getState: () => ({ setAuthContext() {} }) },
    },
  });
  const validation = validateProfileForm({ fullName: 'User', email: '  ' });
  const result = await AuthService.updateCurrentProfile(validation.value);
  assert.equal(result.success, true);
  assert.equal(payload.email, null);
  assert.equal(result.data.user.email, '');
  failure = { response: { data: { message: 'Email sudah digunakan.', errors: [{ field: 'email', message: 'Email sudah digunakan.' }] } } };
  const rejected = await AuthService.updateCurrentProfile({ fullName: 'User', email: 'duplicate@example.com' });
  assert.equal(rejected.success, false);
  assert.equal(rejected.data.errors[0].field, 'email');
});
