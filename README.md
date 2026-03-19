# 🐾 PawPal — Premium Pet Care Manager

A full-stack, production-ready pet care SaaS application with a premium Apple-level UI/UX.

---

## ✨ Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Pet Profiles** — Add multiple pets with photo, age, breed, weight, medical info
- **Task Scheduler** — Feeding, walking, medication, grooming with recurring schedules
- **Drag & Drop** — Reorder tasks with @dnd-kit
- **Smart Reminders** — Browser push notifications with configurable lead time
- **Dashboard** — Live progress tracking, today's tasks, upcoming timeline, pet stats
- **Dark Mode** — Full system-aware dark/light toggle
- **Responsive** — Mobile-first, works on all screen sizes
- **Loading Skeletons** — Polished empty states throughout
- **Offline Fallback** — LocalStorage persistence via Zustand

---

## 📁 Project Structure

```
pawpal/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── petController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Pet.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── pets.js
│   │   └── tasks.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Layout.js        # App shell + sidebar + topbar
    │   │   └── ui/
    │   │       ├── index.js          # Modal, Button, Input, Card, Badge, Skeleton...
    │   │       └── NotificationPanel.js
    │   ├── pages/
    │   │   ├── Dashboard.js          # Overview + stats + timeline
    │   │   ├── Pets.js               # Pet CRUD with photo upload
    │   │   ├── Schedule.js           # Calendar + DnD task list
    │   │   ├── Login.js
    │   │   └── Register.js
    │   ├── services/
    │   │   └── api.js                # Axios instance + API service layer
    │   ├── store/
    │   │   └── index.js              # Zustand stores (auth, pets, tasks, notifs)
    │   ├── styles/
    │   │   └── global.css
    │   ├── utils/
    │   │   └── constants.js          # Categories, species, helpers
    │   ├── App.js
    │   └── index.js
    ├── tailwind.config.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Local Setup (Step by Step)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- npm or yarn

---

### Step 1 — Clone & Navigate

```bash
git clone https://github.com/yourname/pawpal.git
cd pawpal
```

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Copy the env file and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/pawpal
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

---

### Step 3 — Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

Copy the env file:
```bash
cp .env.example .env
```

For local dev, the default proxy in `package.json` points to `http://localhost:5000`, so you don't need to change `.env`.

Start the frontend:
```bash
npm start
```

The app will open at `http://localhost:3000`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user (protected) |
| PATCH | `/api/auth/preferences` | Update user preferences |
| PATCH | `/api/auth/profile` | Update name/avatar |

### Pets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pets` | Get all pets for user |
| GET | `/api/pets/:id` | Get single pet |
| POST | `/api/pets` | Create pet |
| PUT | `/api/pets/:id` | Update pet |
| DELETE | `/api/pets/:id` | Archive pet |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get tasks (filterable by date/pet/category) |
| GET | `/api/tasks/summary` | Dashboard summary data |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/complete` | Mark complete |
| PATCH | `/api/tasks/reorder` | Drag-drop reorder |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🌐 Deployment

### Backend → Render

1. Push your backend folder to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter)
5. Add Environment Variables (from your `.env`):
   - `NODE_ENV=production`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=https://your-pawpal.vercel.app`
6. Deploy → copy your Render URL (e.g. `https://pawpal-api.onrender.com`)

---

### Frontend → Vercel

1. Push your frontend folder to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
4. Add Environment Variable:
   - `REACT_APP_API_URL=https://your-pawpal-api.onrender.com/api`
5. Deploy → your app is live!

---

### MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Database Access → Add a user with read/write permissions
4. Network Access → Add `0.0.0.0/0` (allow all IPs for Render)
5. Connect → Drivers → copy your connection string
6. Replace `<password>` with your DB user password

---

## 🛡️ Security Features

- ✅ JWT authentication with expiry
- ✅ bcrypt password hashing (12 salt rounds)
- ✅ Rate limiting (100 req/15min global, 10 req/hr for auth)
- ✅ Helmet.js security headers
- ✅ CORS with origin whitelist
- ✅ Input validation with express-validator
- ✅ MongoDB injection protection via Mongoose
- ✅ Environment variables for all secrets

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| State | Zustand (with persistence) |
| Drag & Drop | @dnd-kit |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| Validation | express-validator |
| Security | Helmet, express-rate-limit |
| Notifications | Web Notifications API |
| Date Utils | date-fns |

---

## 📱 Browser Notifications

On first login, the app requests notification permission. Tasks with reminders enabled will trigger browser notifications `N` minutes before the scheduled time. This is handled client-side via `requestNotificationPermission()` in `utils/constants.js`.

For production push notifications, integrate a service worker + Web Push API or a service like OneSignal.

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © PawPal
