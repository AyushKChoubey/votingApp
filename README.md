# VoteBooth - Modern Voting Application

A modern voting application built with React frontend and Node.js API backend.

## Architecture

This application uses a modern separated architecture:

- **Frontend**: React SPA with Vite build tool (port 5173)
- **Backend**: Node.js/Express API server (port 5000)
- **Database**: MongoDB
- **Authentication**: JWT tokens + Google OAuth2

## Project Structure

```
votingApp/
├── backend/                 # Node.js API server
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth and security middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── scripts/            # Database scripts
│   ├── server-api.js       # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   └── client/             # Vite React app
│       ├── src/
│       │   ├── components/ # React components
│       │   ├── pages/      # Page components
│       │   ├── context/    # React context
│       │   ├── services/   # API services
│       │   └── hooks/      # Custom hooks
│       └── package.json    # Frontend dependencies
└── README.md              # This file
```

## Development Setup

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend/client
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Configure MongoDB connection and JWT secret
   - **For Google OAuth2 setup**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md) or [OAUTH_QUICKSTART.md](./OAUTH_QUICKSTART.md)

### Running the Application

1. Start the backend API server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend/client
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Features

- User authentication (register/login)
- **Google OAuth2 authentication** (Sign in with Google)
- Create voting booths
- Join voting booths with access codes
- Real-time voting
- Results visualization
- Admin dashboard
- Responsive design with modern teal theme
- Mobile-friendly interface

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/booths` - Get user's booths
- `POST /api/booths` - Create new booth
- `POST /api/booths/join` - Join booth with code
- And more...

## Technologies Used

### Frontend
- React 18
- Vite
- React Router
- React Query
- Tailwind CSS
- Axios
- **react-icons** (Google icon)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- **Passport.js with Google OAuth2**
- **express-session**
- bcrypt
- CORS

## License

This project is licensed under the MIT License.