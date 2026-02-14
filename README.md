# Vehicle Booking System - GIA Group
## 📋 Full-Stack Developer Technical Assessment Project

Vehicle reservation web application developed for GIA Group (Cameroon).

---

## Objective

Build a comprehensive platform enabling users to:
- Browse a catalog of available vehicles
- Reserve vehicles for specific dates
- Manage their reservations
- Receive confirmation notifications

**Users** can:
- Browse a dynamic catalog of available vehicles with advanced filters (category, fuel, transmission, price range)
- Book vehicles for specific dates with real-time availability checks
- Manage their personal dashboard and booking history
- Receive automated email confirmations (booking, welcome, password reset)
- Switch interface language (FR / EN) instantly without page reload

**Admins** can:
- Manage the vehicle fleet (full CRUD — create, view details, edit with pre-filled form, delete)
- Validate / modify / cancel reservations with contextual action icons per status
- Manage user accounts (block/unblock, promote to admin, delete)
- Consult real-time statistics (fleet, revenue, pending bookings)

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (GIA Group branding)
- **State Management:** Context API (Auth + i18n)
- **HTTP Client:** Axios (with JWT interceptors)
- **Notifications:** React Toastify
- **Icons:** React Icons (Font Awesome)
- **Validation:** Zod

### Backend Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5
- **Authentication:** JWT + bcryptjs (12 rounds)
- **Validation:** Zod
- **Email:** Nodemailer (SMTP)
- **Logger:** Winston (structured JSON — INFO / WARN / ERROR)
- **Security:** helmet, express-rate-limit, CORS

### Deployment (Local)
- **Frontend:** Vite dev server — `http://localhost:5173`
- **Backend:** Express — `http://localhost:5000`
- **Database:** PostgreSQL via Laragon (Windows)

### Planned Production Deployment
- **Frontend:** Vercel
- **Backend:** Render.com
- **Database:** Supabase (Free PostgreSQL)

---

## GIA Group Design System

### Color Palette
```css
/* Primary */
--primary-dark:  #1A2B4A;   /* Dark navy blue */
--primary-light: #2E86C1;   /* GIA cyan blue */

/* Secondary */
--white:    #FFFFFF;
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-900: #1A1A1A;

/* Status */
--success: #10B981;
--warning: #F59E0B;
--danger:  #EF4444;
--info:    #3B82F6;
```

### Typography
- **Main font:** Inter, system-ui, sans-serif
- **Titles:** font-bold
- **Body:** font-normal

---

## Features

### MVP (Minimum Viable Product)

#### User
- [x] Registration / Login with JWT session management
- [x] Secure password reset (base64url token, TTL 1h, anti-enumeration)
- [x] Vehicle catalog with filters (category, fuel, transmission, price range)
- [x] Vehicle details page
- [x] Reservation form with date picker
- [x] Real-time availability check (conflict detection)
- [x] User dashboard
- [x] Reservation history with status tracking
- [x] Bilingual interface FR / EN (instant switching, persisted in localStorage)

#### Admin
- [x] Admin dashboard with statistics (fleet, revenue, pending)
- [x] Vehicle management — full CRUD with detail modal and pre-filled edit form
- [x] Reservation management — contextual icons per status (confirm, complete, cancel, reset)
- [x] User management — block/unblock, promote/demote admin, delete
- [x] Optimistic UI updates — instant feedback, silent background sync

#### System
- [x] Email notifications — booking confirmation, welcome, password reset
- [x] Notification history persisted in database
- [x] Date validation and reservation conflict management
- [x] Responsive design (mobile, tablet, desktop)
- [x] Structured logging (Winston)
- [x] Single session enforcement (redirect if already authenticated)

### Future Features (if time permits)
- [ ] Online payment (Stripe / MTN Mobile Money / Orange Money)
- [ ] Vehicle image upload (Cloudinary / AWS S3)
- [ ] PDF reservation export
- [ ] Vehicle geolocation
- [ ] Review system
- [ ] Advanced statistical charts
- [ ] Unit tests (Jest) + E2E tests (Cypress)

---

## Installation

### Prerequisites
- Node.js 20+
- npm 9+
- PostgreSQL 14+

### Quick Start

```bash
# Clone
git clone https://github.com/jufrawep/gia-vehicle-booking.git
cd gia-vehicle-booking

# Backend
cd backend
npm install
cp .env.example .env    # fill in your variables
npx prisma db push
npm run dev             # → http://localhost:5000

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev             # → http://localhost:5173
```

### Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gia_booking"
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@giagroup.net
FRONTEND_URL=http://localhost:5173
```

### Create Admin Account

```bash
# 1. Register via the app  →  POST /api/auth/register
# 2. Promote to admin:
psql -U postgres -d gia_booking -c "
  UPDATE users SET role = 'ADMIN', status = 'ACTIVE', permissions = '{}'
  WHERE email = 'your-admin@email.com';
"
```

> Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Contact

**Developer:** Epanti Awoum Franc Junior  
**Email:** francjuniorepanti@gmail.com  
**GitHub:** github.com/jufrawep

---

## License

This project is developed as part of a technical test for GIA Group and any use requires the developer's approval.

---

**Deadline:** February 15, 2026 at midnight  
**Creation date:** February 5, 2026  
**Submission date:** February 14, 2026