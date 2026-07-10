# 🚀 GBPANT Alumni Portal Backend

Backend server for the GBPANT Alumni Portal with integrated CAPTCHA security system.

## 🎯 Quick Start

### Option 1: Automated Setup (Recommended)
```cmd
# Windows
start.bat

# Or manually:
npm install
copy .env.example .env
npm run dev
```

### Option 2: Manual Setup
```cmd
# 1. Install dependencies
npm install

# 2. Install canvas (optional, for PNG CAPTCHAs)
npm install canvas

# 3. Create environment file
copy .env.example .env

# 4. Update .env with your configuration
# Edit .env file with your database credentials, JWT secret, etc.

# 5. Start development server
npm run dev
```

## 📋 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Test CAPTCHA functionality
- `npm run test-server` - Test server startup

## 🔧 Environment Configuration

Update `.env` file with your settings:

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alumni_portal
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_very_long_and_random_secret_key
JWT_EXPIRE=24h

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CAPTCHA Security
CAPTCHA_SALT=your_unique_captcha_salt
SKIP_CAPTCHA=false

# Server
PORT=5000
NODE_ENV=development
```

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server status

### CAPTCHA System
- `POST /api/captcha/generate` - Generate new CAPTCHA
- `POST /api/captcha/verify` - Verify CAPTCHA input
- `GET /api/captcha/stats` - CAPTCHA statistics (debug)

### Authentication (Mock Implementation)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/set-password` - Set password

## 🔒 CAPTCHA Security Features

- **Dual Image Generation**: Canvas PNG (primary) + SVG (fallback)
- **Secure Hashing**: SHA-256 with salt and timestamp
- **Time-based Security**: 2-second minimum, 5-minute expiry
- **Rate Limiting**: 10 requests per minute per IP
- **Attempt Limiting**: Max 3 attempts per session
- **Visual Distortion**: Noise, rotation, multiple fonts

## 🧪 Testing

### Test CAPTCHA System
```cmd
npm test
```

### Test Server Startup
```cmd
npm run test-server
```

### Test Endpoints
```cmd
# Health check
curl http://localhost:5000/api/health

# Generate CAPTCHA
curl -X POST http://localhost:5000/api/captcha/generate

# Verify CAPTCHA
curl -X POST http://localhost:5000/api/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","captcha":"ABC123"}'
```

## 🛠️ Dependencies

### Core Dependencies
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **pg** - PostgreSQL client
- **nodemailer** - Email sending

### Optional Dependencies
- **canvas** - PNG CAPTCHA generation (falls back to SVG if unavailable)

## 🚨 Troubleshooting

### Canvas Installation Issues
If canvas installation fails:
```cmd
# Try installing with build tools
npm install --build-from-source canvas

# Or skip canvas (SVG CAPTCHAs will be used)
# The system works fine without canvas
```

### Port Already in Use
```cmd
# Check what's using port 5000
netstat -ano | findstr :5000

# Or change port in .env
PORT=3001
```

### CORS Issues
Update `server.js` if your frontend runs on a different port:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'your-frontend-url'],
  credentials: true
}));
```

## 📁 Project Structure

```
backend/
├── utils/
│   └── captcha.js          # CAPTCHA generation and verification
├── routes/
│   └── captcha.js          # CAPTCHA API endpoints
├── middleware/
│   └── captcha.js          # Security middleware
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── .env.example           # Environment template
├── .env                   # Your configuration (create this)
├── test-captcha.js        # CAPTCHA system test
├── test-server.bat        # Server startup test
└── start.bat              # Automated setup script
```

## 🔄 Development Workflow

1. **Start Development Server**
   ```cmd
   npm run dev
   ```

2. **Test CAPTCHA System**
   ```cmd
   npm test
   ```

3. **Check Server Health**
   - Visit: http://localhost:5000/api/health

4. **Generate CAPTCHA**
   - POST to: http://localhost:5000/api/captcha/generate

5. **Monitor Logs**
   - Server logs show all CAPTCHA requests and responses
   - Check for rate limiting and error patterns

## 🚀 Production Deployment

1. **Set Environment Variables**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Use Process Manager**
   ```cmd
   npm install -g pm2
   pm2 start server.js --name "alumni-portal-backend"
   ```

3. **Set up Reverse Proxy** (nginx, Apache, etc.)

4. **Enable HTTPS** and secure cookies

## 📊 Monitoring

### CAPTCHA Statistics
- Visit: http://localhost:5000/api/captcha/stats
- Monitor active sessions and attempt patterns

### Server Logs
- All CAPTCHA operations are logged
- Rate limiting events are tracked
- Error patterns are recorded

## 🆘 Support

If you encounter issues:

1. **Check the logs** - Server console shows detailed error messages
2. **Run tests** - `npm test` to verify CAPTCHA functionality
3. **Check environment** - Ensure `.env` file is properly configured
4. **Verify dependencies** - Run `npm install` to ensure all packages are installed

## 📝 Next Steps

1. **Implement Authentication** - Replace mock auth endpoints with real implementation
2. **Set up Database** - Configure PostgreSQL and run schema files
3. **Configure Email** - Set up SMTP for OTP sending
4. **Add More Security** - Implement additional security measures as needed

The CAPTCHA system is fully functional and ready to use with your frontend application!
