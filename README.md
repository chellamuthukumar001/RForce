# Disaster Volunteer Coordination Web Application

A full-stack AI-assisted disaster volunteer coordination platform that enables verified admins (NGOs/authorities) to create disaster events and tasks, and intelligently assign nearby volunteers using AI-based ranking, while visualizing everything on a live map.

## 🧩 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Maps**: Leaflet with OpenStreetMap
- **AI**: Custom JavaScript-based volunteer ranking algorithm

## 📁 Project Structure

```
disaster/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & role checking
│   │   ├── services/        # Geocoding service
│   │   ├── ai/             # Volunteer ranking algorithm
│   │   ├── server.js       # Main server file
│   │   └── mockData.js     # Sample data
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API & Supabase clients
│   │   ├── context/       # Auth context
│   │   ├── App.jsx        # Main app with routing
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account (free tier works)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:3000`

## 🗄️ Supabase Database Schema

You need to create the following tables in your Supabase project:

### 1. user_roles
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. volunteers
```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  skills TEXT[],
  availability TEXT DEFAULT 'available',
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  completed_tasks INTEGER DEFAULT 0,
  total_assigned_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. disasters
```sql
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  urgency TEXT CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[],
  status TEXT DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. task_assignments
```sql
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  ai_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Helper Functions
```sql
-- Function to increment assigned tasks count
CREATE OR REPLACE FUNCTION increment_assigned_tasks(volunteer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE volunteers
  SET total_assigned_tasks = total_assigned_tasks + 1
  WHERE id = volunteer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment completed tasks count
CREATE OR REPLACE FUNCTION increment_completed_tasks(volunteer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE volunteers
  SET completed_tasks = completed_tasks + 1
  WHERE id = volunteer_id;
END;
$$ LANGUAGE plpgsql;
```

## 🌟 Key Features

### For Volunteers
- Register and create profile with skills and location
- View assigned tasks
- Accept or decline tasks
- Update availability status
- View disasters and volunteers on map

### For Admins
- Create disaster events
- Create tasks under disasters
- View all volunteers on map
- Get AI-based volunteer recommendations
- Auto-assign top-ranked volunteers
- Manual task assignment

### AI Features
- **Skill Matching**: Matches volunteer skills with task requirements
- **Distance Calculation**: Uses Haversine formula to calculate proximity
- **Availability Scoring**: Prioritizes available volunteers
- **Reliability Scoring**: Considers completion rate and history
- **Urgency Adaptation**: Adjusts weights based on disaster urgency

## 🗺️ Map Features

- Interactive Leaflet map with OpenStreetMap tiles
- Color-coded markers for disasters (by urgency)
- Volunteer markers with availability status
- Click markers for detailed information
- Auto-geocoding for city/state/country inputs

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Volunteers
- `POST /api/volunteers` - Create/update profile
- `GET /api/volunteers` - Get all volunteers (Admin)
- `GET /api/volunteers/me` - Get my profile
- `PATCH /api/volunteers/availability` - Update availability

### Disasters
- `POST /api/disasters` - Create disaster (Admin)
- `GET /api/disasters` - Get all disasters
- `GET /api/disasters/:id` - Get disaster by ID
- `PATCH /api/disasters/:id` - Update disaster status (Admin)

### Tasks
- `POST /api/tasks` - Create task (Admin)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/my-tasks` - Get my assigned tasks
- `POST /api/tasks/:id/assign` - Assign volunteers (Admin)
- `PATCH /api/tasks/assignments/:id` - Update assignment status

### AI
- `POST /api/ai/rank-volunteers` - Get AI-ranked volunteers (Admin)
- `POST /api/ai/auto-assign` - Auto-assign top volunteers (Admin)

## 🎨 Design Highlights

- Clean, minimal emergency-friendly UI
- Tailwind CSS for rapid styling
- Mobile-responsive design
- Vibrant color palette with urgency-based color coding
- Smooth transitions and hover effects
- Professional typography (Inter font)

## 📦 Sample Data

The backend includes mock data in `backend/src/mockData.js` for testing purposes.

## 🛠️ Development Notes

- **No hard-coded distances**: All calculations use geolocation
- **Role-based access**: Middleware ensures admins-only routes
- **AI runs server-side**: All ranking logic is in the backend
- **Clean architecture**: Separated concerns with services and routes
- **Comprehensive comments**: Code is well-documented

## 📄 License

MIT

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

---

Built with ❤️ for humanitarian coordination
