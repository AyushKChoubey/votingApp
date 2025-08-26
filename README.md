# Voting App

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