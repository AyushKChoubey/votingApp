# Secure Voting Application

A comprehensive, secure voting application built with Node.js, Express, MongoDB, and EJS templating. This application provides a complete booth management system with real-time voting capabilities, advanced security features, and production-ready deployment configurations.

## 🚀 Features

### Core Voting System
- **Multi-Booth Management**: Create and manage multiple independent voting booths
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Role-Based Access**: Admin, moderator, and voter roles with different permissions
- **Real-time Results**: Live vote counting and results display
- **Flexible Voting Rules**: Configure anonymous voting, vote changes, and result visibility

### Security Features
- **Rate Limiting**: Comprehensive rate limiting for all endpoints
- **Input Validation**: Extensive validation and sanitization
- **XSS Protection**: Built-in cross-site scripting prevention
- **CSRF Protection**: Request origin validation
- **Security Headers**: Helmet.js integration with CSP
- **Account Locking**: Automatic account lockout after failed attempts
- **Password Security**: Bcrypt hashing with configurable rounds

### Advanced Booth Features
- **Invite System**: Unique invite codes and shareable links
- **Member Management**: Add/remove members, view participation
- **Email Domain Restrictions**: Limit access by email domains
- **Time-based Voting**: Set start/end times for voting periods
- **Capacity Limits**: Set maximum members per booth
- **Settings Customization**: Fine-tune booth behavior

### Admin Features
- **Dashboard**: Comprehensive admin panel for booth management
- **Analytics**: Vote statistics and participation metrics
- **Member Control**: Remove members, reset invite codes
- **Audit Trail**: Complete voting history and logs

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh mechanism
- **Templating**: EJS with Bootstrap styling
- **Security**: Helmet, express-rate-limit, bcrypt
- **Validation**: Validator.js, express-mongo-sanitize
- **Development**: Nodemon, ESLint, Prettier

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- MongoDB 4.4 or higher
- npm 8.0.0 or higher

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd secure-voting-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3000
MONGODB_URL=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### 3. Database Setup

```bash
# Run migrations
npm run migrate

# Seed with sample data (development only)
npm run seed
```

### 4. Start Application

```bash
# Development
npm run dev

# Production
npm start
```

## 🏗️ Project Structure

```
secure-voting-app/
├── controllers/          # Request handlers
│   ├── boothController.js
│   └── userController.js
├── middleware/           # Custom middleware
│   ├── jwt.js           # Authentication middleware
│   └── security.js      # Security middleware
├── models/              # Database models
│   ├── booth.js
│   ├── user.js
│   └── vote.js
├── routes/              # Route definitions
│   ├── boothRoutes.js
│   └── userRoutes.js
├── views/               # EJS templates
│   ├── booth/
│   ├── user/
│   └── layouts/
├── public/              # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── scripts/             # Utility scripts
│   ├── migrate.js
│   ├── seed.js
│   ├── cleanup.js
│   └── backup.js
├── logs/                # Application logs
├── server.js            # Main application file
└── ecosystem.config.js  # PM2 configuration
```

## 📊 API Endpoints

### Authentication
- `POST /user/register` - User registration
- `POST /user/login` - User login
- `GET /user/logout` - User logout
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `PUT /user/profile/password` - Change password

### Booth Management
- `GET /booth/dashboard` - User dashboard
- `GET /booth/create` - Create booth form
- `POST /booth/create` - Create new booth
- `GET /booth/:id` - View booth details
- `GET /booth/:id/admin` - Admin panel
- `GET /booth/:id/results` - View results
- `POST /booth/:id/vote` - Cast vote
- `GET /booth/join/:code` - Join booth via code
- `POST /booth/join/:code` - Process booth join

### API Routes (JSON)
- `GET /api/v1/booth/user/booths` - Get user's booths
- `GET /api/v1/booth/:id` - Get booth details
- `GET /api/v1/booth/:id/results` - Get booth results
- `POST /api/v1/booth/:id/reset-code` - Reset invite code

## 🔐 Security Features

### Authentication Security
- JWT tokens with configurable expiration
- Refresh token mechanism
- Token blacklisting for logout
- Account lockout after failed attempts
- Password strength requirements
- Secure password hashing with bcrypt

### Request Security
- Rate limiting on all endpoints
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection headers
- CSRF protection for forms
- Security headers with Helmet.js

### Data Security
- Encrypted password storage
- Secure cookie configuration
- Input length limits
- File type restrictions
- SQL injection prevention

## 🚀 Production Deployment

### Option 1: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2:start

# Monitor
pm2 monit

# View logs
pm2 logs voting-app
```

### Option 2: Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

### Option 3: Manual Deployment

```bash
# Set environment
export NODE_ENV=production

# Install production dependencies
npm ci --only=production

# Start application
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | Server port | 3000 | No |
| `MONGODB_URL` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | JWT_SECRET | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost:3000 | No |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 | No |

### Database Configuration

The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `booths` - Voting booth configurations
- `votes` - Individual vote records

### Security Configuration

- **Rate Limiting**: Configurable limits for different endpoints
- **Session Security**: Secure cookie settings for production
- **CORS**: Configurable origins for cross-origin requests
- **CSP**: Content Security Policy headers

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- controllers/userController.test.js
```

## 📝 Logging

The application includes comprehensive logging:
- Request/response logging with Morgan
- Error logging with stack traces
- Security event logging
- Performance monitoring logs

Logs are stored in the `logs/` directory:
- `app.log` - General application logs
- `error.log` - Error logs only
- `access.log` - HTTP access logs

## 🔧 Maintenance Scripts

### Database Migration
```bash
npm run migrate
```

### Database Seeding
```bash
npm run seed
```

### Database Cleanup
```bash
node scripts/cleanup.js
```

### Database Backup
```bash
node scripts/backup.js
```

## 📈 Monitoring and Health Checks

The application includes built-in monitoring:

- **Health Check Endpoint**: `GET /health`
- **Performance Metrics**: Memory usage, response times
- **Error Tracking**: Automatic error logging and reporting
- **Uptime Monitoring**: Process monitoring with PM2

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Code Standards
- ESLint configuration for code quality
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for testing

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Issues**
```bash
# Check MongoDB status
mongosh --eval "db.runCommand('ping')"

# Verify connection string
echo $MONGODB_URL
```

**JWT Token Issues**
```bash
# Verify JWT secrets are set
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
```

**Port Already in Use**
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 <PID>
```

### Performance Optimization

1. **Database Indexes**: Ensure proper indexing for queries
2. **Connection Pooling**: Configure MongoDB connection pool
3. **Caching**: Implement Redis for session storage
4. **Static Assets**: Use CDN for static file serving
5. **Compression**: Enable gzip compression

### Security Checklist

- [ ] Update all dependencies regularly
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up proper firewall rules
- [ ] Monitor for security vulnerabilities
- [ ] Regular security audits with `npm audit`

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting guide
- Contact the development team

---

**Made with ❤️ for secure, transparent voting**