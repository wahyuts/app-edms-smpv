const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const supportedAppEnvs = ['development', 'test', 'staging', 'production'];
const supportedCookieSameSites = ['none', 'lax', 'strict'];
const supportedStorageDrivers = ['local', 'r2'];
const weakJwtSecrets = ['replace_with_secure_secret', 'change_this_secret', 'secret'];
const requiredAppEnv = ['APP_NAME', 'APP_VERSION', 'APP_ENV', 'PORT'];
const requiredDatabaseEnv = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_DATABASE', 'MYSQL_USER'];
const requiredLocalStorageEnv = ['STORAGE_PATH'];
const requiredR2StorageEnv = [
  'R2_ACCOUNT_ID',
  'R2_BUCKET_NAME',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_REGION',
];
const requiredSecurityEnv = [
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'PASSWORD_RESET_EXPIRES_IN',
  'CORS_ALLOWED_ORIGINS',
  'BCRYPT_ROUNDS',
];
const productionEmailEnv = ['RESEND_API_KEY', 'EMAIL_FROM', 'FRONTEND_RESET_PASSWORD_URL'];
const supportedEmailProviders = ['dummy', 'resend'];
const hasResendApiKey = () => {
  return process.env.RESEND_API_KEY !== undefined && process.env.RESEND_API_KEY.trim() !== '';
};
const getEmailProvider = () => {
  return (process.env.EMAIL_PROVIDER || (hasResendApiKey() ? 'resend' : 'dummy')).trim().toLowerCase();
};
const getBooleanEnv = (key, defaultValue = false) => {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
};

const getCookieSameSite = () => {
  return (process.env.COOKIE_SAME_SITE || 'lax').trim().toLowerCase();
};

const validateRequiredEnv = (keys, label) => {
  const missingKeys = keys.filter((key) => {
    return process.env[key] === undefined || process.env[key].trim() === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(`[ENV] Missing required ${label} environment: ${missingKeys.join(', ')}`);
  }
};

const validatePort = (value, key) => {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`[ENV] ${key} must be a valid port number`);
  }

  return port;
};

const validateAppEnv = () => {
  validateRequiredEnv(requiredAppEnv, 'application');

  if (!supportedAppEnvs.includes(process.env.APP_ENV)) {
    throw new Error(`[ENV] APP_ENV must be one of: ${supportedAppEnvs.join(', ')}`);
  }

  validatePort(process.env.PORT, 'PORT');
};

const validateRequiredDatabaseEnv = () => {
  validateRequiredEnv(requiredDatabaseEnv, 'database');
  validatePort(process.env.MYSQL_PORT, 'MYSQL_PORT');
};

validateAppEnv();
validateRequiredDatabaseEnv();

const getStorageDriver = () => {
  return (process.env.STORAGE_DRIVER || 'local').trim().toLowerCase();
};

const validateRequiredStorageEnv = () => {
  const storageDriver = getStorageDriver();

  if (!supportedStorageDrivers.includes(storageDriver)) {
    throw new Error(`[ENV] STORAGE_DRIVER must be one of: ${supportedStorageDrivers.join(', ')}`);
  }

  if (storageDriver === 'local') {
    validateRequiredEnv(requiredLocalStorageEnv, 'local storage');
  }

  if (storageDriver === 'r2') {
    validateRequiredEnv(requiredR2StorageEnv, 'R2 storage');

    try {
      new URL(process.env.R2_ENDPOINT);
    } catch (error) {
      throw new Error('[ENV] R2_ENDPOINT must be a valid URL');
    }
  }
};

validateRequiredStorageEnv();

const getUploadMaxFileSizeBytes = () => {
  const value = process.env.UPLOAD_MAX_FILE_SIZE_BYTES || String(25 * 1024 * 1024);
  const maxFileSizeBytes = Number(value);

  if (!Number.isInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('[ENV] UPLOAD_MAX_FILE_SIZE_BYTES must be a positive integer');
  }

  return maxFileSizeBytes;
};

const uploadMaxFileSizeBytes = getUploadMaxFileSizeBytes();

const getUploadTemporaryTtlHours = () => {
  const value = process.env.UPLOAD_TEMPORARY_TTL_HOURS || '24';
  const ttlHours = Number(value);

  if (!Number.isInteger(ttlHours) || ttlHours <= 0) {
    throw new Error('[ENV] UPLOAD_TEMPORARY_TTL_HOURS must be a positive integer');
  }

  return ttlHours;
};

const uploadTemporaryTtlHours = getUploadTemporaryTtlHours();

const validateSecurityEnv = () => {
  validateRequiredEnv(requiredSecurityEnv, 'security');

  const bcryptRounds = Number(process.env.BCRYPT_ROUNDS);
  const cookieSameSite = getCookieSameSite();

  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
    throw new Error('[ENV] BCRYPT_ROUNDS must be an integer between 10 and 15');
  }

  if (
    process.env.COOKIE_SECURE !== undefined &&
    !['true', 'false'].includes(process.env.COOKIE_SECURE.trim().toLowerCase())
  ) {
    throw new Error('[ENV] COOKIE_SECURE must be true or false');
  }

  if (!supportedCookieSameSites.includes(cookieSameSite)) {
    throw new Error(`[ENV] COOKIE_SAME_SITE must be one of: ${supportedCookieSameSites.join(', ')}`);
  }

  if (!/^(\d+)([smhd])$/.test(process.env.PASSWORD_RESET_EXPIRES_IN)) {
    throw new Error('[ENV] PASSWORD_RESET_EXPIRES_IN must use duration format like 15m, 1h, or 1d');
  }

  if (process.env.APP_ENV === 'production' && weakJwtSecrets.includes(process.env.JWT_SECRET)) {
    throw new Error('[ENV] JWT_SECRET must be secure in production');
  }

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error('[ENV] CORS_ALLOWED_ORIGINS must contain at least one origin');
  }

  if (process.env.APP_ENV === 'production' && allowedOrigins.includes('*')) {
    throw new Error('[ENV] CORS_ALLOWED_ORIGINS cannot use wildcard in production');
  }
};

validateSecurityEnv();

const validateEmailEnv = () => {
  const emailProvider = getEmailProvider();

  if (!supportedEmailProviders.includes(emailProvider)) {
    throw new Error(`[ENV] EMAIL_PROVIDER must be one of: ${supportedEmailProviders.join(', ')}`);
  }

  if (emailProvider === 'resend' && !hasResendApiKey()) {
    throw new Error('[ENV] RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
  }

  if (process.env.APP_ENV === 'production') {
    validateRequiredEnv(productionEmailEnv, 'email');

    if (emailProvider !== 'resend') {
      throw new Error('[ENV] EMAIL_PROVIDER must be resend in production');
    }

    if (getBooleanEnv('ENABLE_DEV_EMAIL_OUTBOX', false)) {
      throw new Error('[ENV] ENABLE_DEV_EMAIL_OUTBOX must be false in production');
    }

    if (!process.env.RESEND_API_KEY.startsWith('re_')) {
      throw new Error('[ENV] RESEND_API_KEY must be a valid Resend key in production');
    }

    if (!process.env.FRONTEND_RESET_PASSWORD_URL.startsWith('https://')) {
      throw new Error('[ENV] FRONTEND_RESET_PASSWORD_URL must use HTTPS in production');
    }
  }

  if (hasResendApiKey() && !process.env.RESEND_API_KEY.startsWith('re_')) {
    throw new Error('[ENV] RESEND_API_KEY must start with re_ when configured');
  }

  if (process.env.FRONTEND_RESET_PASSWORD_URL && process.env.FRONTEND_RESET_PASSWORD_URL.trim() !== '') {
    try {
      new URL(process.env.FRONTEND_RESET_PASSWORD_URL);
    } catch (error) {
      throw new Error('[ENV] FRONTEND_RESET_PASSWORD_URL must be a valid URL');
    }
  }
};

validateEmailEnv();

const env = {
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
  appEnv: process.env.APP_ENV,
  port: Number(process.env.PORT),
  database: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  },
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN,
  email: {
    provider: getEmailProvider(),
    enableDevEmailOutbox: getBooleanEnv(
      'ENABLE_DEV_EMAIL_OUTBOX',
      process.env.APP_ENV !== 'production' && getEmailProvider() === 'dummy'
    ),
    resendApiKey: process.env.RESEND_API_KEY || '',
    useResend: getEmailProvider() === 'resend',
    from: process.env.EMAIL_FROM || 'EDMS <noreply@example.test>',
    frontendResetPasswordUrl: process.env.FRONTEND_RESET_PASSWORD_URL || 'http://localhost:5173/reset-password',
  },
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
  storage: {
    driver: getStorageDriver(),
    path: process.env.STORAGE_PATH || './storage',
    r2: {
      accountId: process.env.R2_ACCOUNT_ID || '',
      bucketName: process.env.R2_BUCKET_NAME || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      endpoint: process.env.R2_ENDPOINT || '',
      region: process.env.R2_REGION || 'auto',
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
    },
  },
  storagePath: process.env.STORAGE_PATH || './storage',
  upload: {
    maxFileSizeBytes: uploadMaxFileSizeBytes,
    temporaryTtlHours: uploadTemporaryTtlHours,
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS),
  cookie: {
    secure: getBooleanEnv('COOKIE_SECURE', false),
    sameSite: getCookieSameSite(),
  },
};

module.exports = env;
