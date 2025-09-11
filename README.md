# Secure Voting Application

A comprehensive, secure voting application built with Node.js, Express, MongoDB, and EJS. Perfect for organizations, schools, and communities to conduct fair and transparent elections.

## Features

### 🏛️ User Roles
- **Admin (Booth Creator)**: Create booths, set candidates, manage members, view results
- **Voter (Member)**: Join booths, vote once per booth, view results (if enabled)

### 🗳️ Booth System
- **Secure Booth Creation**: Each booth has unique invite codes and links
- **Member Management**: Control who can join with email domain restrictions
- **Flexible Settings**: Configure voting periods, result visibility, and member limits
- **Real-time Updates**: Live member count and voting status

### 🔒 Security Features
- **JWT Authentication**: Secure token-based authentication
- **One Vote Per Booth**: Enforced with MongoDB unique indexes
- **Audit Trail**: Complete voting history with timestamps and IP tracking
- **Rate Limiting**: Prevent abuse with configurable limits
- **Password Security**: Bcrypt hashing for user passwords

### 📊 Results & Analytics
- **Real-time Results**: Live vote counting and progress tracking
- **Visual Charts**: Chart.js integration for result visualization
- **Export Options**: Print and share results
- **Detailed Statistics**: Participation rates and voting analytics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templating, Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Charts**: Chart.js
- **Security**: bcrypt, cookie-parser

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AyushKChoubey/votingApp.git
   cd votingApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/votingapp
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Start MongoDB**
   - If using local MongoDB: `mongod`
   - If using MongoDB Atlas: Update MONGODB_URI in .env

5. **Build CSS (if using custom Tailwind)**
   ```bash
   npm run build:css
   ```

6. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm install -g nodemon
   nodemon server.js
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage Guide

### For Administrators (Booth Creators)

1. **Register/Login**: Create an account or login
2. **Create a Booth**: 
   - Go to Dashboard → "Create New Booth"
   - Set booth name, description, and candidates
   - Configure settings (results visibility, member limits, etc.)
3. **Share Invite**: Copy the invite link or share the booth code
4. **Manage Members**: View who joined, remove members if needed
5. **Monitor Voting**: Track real-time voting progress
6. **View Results**: Access detailed results and analytics

### For Voters (Members)

1. **Register/Login**: Create an account or login
2. **Join a Booth**:
   - Use invite link (click and join automatically)
   - Or enter booth code manually
3. **Cast Your Vote**: Select your preferred candidate
4. **View Results**: See voting results (if enabled by admin)

## Project Structure

```
votingApp/
├── controllers/          # Business logic
│   ├── boothControler.js # Booth operations
│   ├── candidateController.js
│   └── userController.js
├── middleware/           # Custom middleware
│   └── jwt.js           # JWT authentication
├── models/              # Database schemas
│   ├── booth.js         # Booth model
│   ├── candidate.js     # Candidate model
│   ├── user.js          # User model
│   └── vote.js          # Vote model
├── routes/              # API routes
│   ├── boothRoutes.js   # Booth-related routes
│   ├── candidateRoutes.js
│   └── userRoutes.js
├── views/               # EJS templates
│   ├── booth/           # Booth-specific pages
│   ├── error.ejs        # Error page
│   └── index.ejs        # Home page
├── public/              # Static files
│   └── css/             # Stylesheets
├── server.js            # Main application file
└── db.js               # Database connection
```

## API Documentation

### Authentication Endpoints
- `POST /user/register` - Register new user
- `POST /user/login` - User login
- `GET /user/profile` - Get user profile
- `GET /logout` - Logout user

### Booth Endpoints
- `GET /booth/dashboard` - User dashboard
- `GET /booth/create` - Create booth page
- `POST /booth/create` - Create new booth
- `GET /booth/join` - Join booth page
- `GET /booth/join/:code` - Join via invite link
- `POST /booth/join/:code` - Join booth
- `GET /booth/:id` - View booth details
- `POST /booth/:id/vote` - Cast vote
- `GET /booth/:id/results` - View results
- `GET /booth/:id/admin` - Admin panel (creator only)
- `POST /booth/:id/reset-code` - Reset invite code

## Security Considerations

- **Environment Variables**: Never commit `.env` files
- **JWT Secret**: Use a strong, unique secret for production
- **Database Security**: Enable MongoDB authentication
- **HTTPS**: Use HTTPS in production
- **Rate Limiting**: Configure appropriate limits
- **Input Validation**: All inputs are validated and sanitized

## Database Schema

### User Model
- Authentication fields (email, password)
- Profile information
- References to created/joined booths
- Security fields (verification, reset tokens)

### Booth Model
- Basic info (name, description, creator)
- Invite system (code, link generation)
- Member management
- Settings (visibility, restrictions)
- Vote tracking

### Vote Model
- Audit trail with user, booth, candidate references
- Metadata (IP, user agent, timestamp)
- Unique constraints to prevent duplicate voting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **JWT Authentication Failed**
   - Check JWT_SECRET in .env
   - Clear browser cookies and login again

3. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using the port: `lsof -ti:3000 | xargs kill`

4. **CSS Not Loading**
   - Run `npm run build:css`
   - Check static file serving configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please create an issue in the GitHub repository or contact the maintainers.

---

**Made with ❤️ for secure and transparent voting**

Welcome to the Voting App! This is a modern, secure, and user-friendly web application for online voting, built with Node.js, Express, MongoDB, EJS, and Tailwind CSS.

## Features
- User registration and login (Aadhar number as username)
- Admin and voter roles
- Candidate management (add, update, delete)
- Secure voting (one vote per user, admins cannot vote)
- Real-time results display
- Beautiful, responsive UI with Tailwind CSS
- JWT-based authentication and authorization

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB (local or cloud)

### Installation
1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd votingApp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file:
   ```env
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-secret-key>
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and go to `http://localhost:3000`

## Usage
- Register as a voter or admin using your Aadhar number.
- Login to access your profile and vote for candidates.
- Admins can manage candidates.
- View live results and candidate lists.

## Folder Structure
```
votingApp/
├── controllers/
├── middleware/
├── models/
├── public/
├── routes/
├── views/
├── server.js
├── package.json
├── README.md
```

## Tech Stack
- Node.js
- Express
- MongoDB & Mongoose
- EJS (server-side rendering)
- Tailwind CSS (modern UI)
- JWT (authentication)

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the ISC License.

---

Enjoy secure and easy online voting! 🚀

//possible errors 

1. tailwind cli not installed properly so using tailwind cdn
2. adhar number throws err when trying to register {sorted just success and err log to be on register page}
3. login not performing well { logic fixed message for login succesful}