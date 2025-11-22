# Staffdox - Placement Consultancy Platform

A comprehensive job portal and placement consultancy platform built with React and Node.js, inspired by Michael Page. This platform connects job seekers with employers and provides a complete recruitment solution.

## Features

### For Job Seekers
- **User Registration & Authentication** - Secure login with email/password or OAuth (Google, LinkedIn)
- **Comprehensive Profile Management** - Detailed professional profiles with skills, experience, education, and job preferences
- **Job Search & Discovery** - Advanced search and filtering capabilities
- **Job Applications** - Easy application process with cover letter and resume upload
- **Application Tracking** - Monitor application status and manage job applications
- **Profile Completeness** - Track and improve profile completeness score

### For Employers/Admins
- **Admin Dashboard** - Complete job management system
- **Job Posting** - Create and manage job listings with detailed requirements
- **Application Management** - Review and manage job applications
- **Analytics** - Job statistics and application insights
- **User Management** - Manage user accounts and permissions

### Platform Features
- **Responsive Design** - Mobile-first design that works on all devices
- **Modern UI/UX** - Clean, professional interface inspired by leading job portals
- **Real-time Updates** - Live application status updates
- **Search & Filter** - Advanced job search with multiple filter options
- **Category-based Organization** - Jobs organized by industry and function

## Technology Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Toast notifications
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

## Project Structure

```
Staffdox_webapp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets
│   └── public/            # Public assets
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── config/        # Configuration files
│   └── server.js         # Main server file
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Staffdox_webapp
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/staffdox
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   CLIENT_URL=http://localhost:5173
   PORT=5000
   
   # OAuth Configuration (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   ```

5. **Start the development servers**
   
   Backend (from backend directory):
   ```bash
   npm run dev
   ```
   
   Frontend (from client directory):
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/linkedin` - LinkedIn OAuth

### User Management
- `GET /api/user/me` - Get current user profile
- `PUT /api/user/me` - Update user profile

### Job Management
- `GET /api/jobs` - Get all jobs (with filtering)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job (admin/recruiter)
- `PUT /api/jobs/:id` - Update job (admin/recruiter)
- `DELETE /api/jobs/:id` - Delete job (admin/recruiter)
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/user/applications` - Get user applications
- `GET /api/jobs/my/jobs` - Get jobs posted by user
- `GET /api/jobs/stats` - Get job statistics

## Database Models

### User Model
- Basic information (name, email, phone, location)
- Professional details (position, company, experience, skills)
- Education and work experience
- Job preferences and availability
- Application tracking

### Job Model
- Job details (title, company, location, description)
- Requirements and responsibilities
- Salary and experience range
- Skills and benefits
- Application management
- Status and deadlines

## Features in Detail

### Job Search & Filtering
- Text search across job titles, descriptions, and companies
- Filter by category, location, employment type, experience level
- Salary range filtering
- Sort by date, title, salary, etc.
- Pagination for large result sets

### Profile Management
- Multi-tab profile interface
- Professional information management
- Education and experience tracking
- Skills and job preferences
- Profile completeness scoring

### Admin Dashboard
- Job creation and management
- Application review and status updates
- Statistics and analytics
- User management capabilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, create an issue in the repository.

## Roadmap

- [ ] Email notifications for job applications
- [ ] Advanced analytics dashboard
- [ ] Resume parsing and matching
- [ ] Video interview integration
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced search with AI recommendations
- [ ] Company profiles and branding
- [ ] Salary insights and market data
