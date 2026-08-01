require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const corsConfig = require('./config/cors');
const requestLogger = require('./middlewares/requestLogger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const passwordRoutes = require('./routes/password.routes');
const devEmailOutboxRoutes = require('./routes/devEmailOutbox.routes');
const documentRoutes = require('./routes/document.routes');
const departmentRoutes = require('./routes/department.routes');
const escalationRoutes = require('./routes/escalation.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const projectMembershipRoutes = require('./routes/projectMembership.routes');
const projectContextRoutes = require('./routes/projectContext.routes');
const profileRoutes = require('./routes/profile.routes');
const slaRoutes = require('./routes/sla.routes');
const storageRoutes = require('./routes/storage.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();

app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/audit-trails', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/password', passwordRoutes);
app.use('/api/v1/dev/email-outbox', devEmailOutboxRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/escalations', escalationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/project-memberships', projectMembershipRoutes);
app.use('/api/v1/project-context', projectContextRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/sla', slaRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/v1/system', systemRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
