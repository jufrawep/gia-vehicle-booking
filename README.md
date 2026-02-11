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

**users** can:
- Browse a dynamic catalog of available vehicles.
- Book vehicles for specific dates with real-time availability checks.
- Manage their personal dashboard and booking history.
- Receive automated email confirmations.

**admin** can:
- Manage the vehicle fleet
- Validate/modify/cancel reservations
- Consult statistics

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (GIA Group branding)
- **State Management:** React Query + Context API
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod validation
- **Date Picker:** React DatePicker
- **Notifications:** React Toastify

### Backend Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Validation:** Zod
- **Email:** Nodemailer
- **CORS:** cors middleware
- **Security:** helmet, express-rate-limit

### Initial Deployment
- **Frontend:** Vercel (https://votreapp.vercel.app)
- **Backend:** Render.com (https://votreapi.onrender.com)
- **Database:** Supabase (Free PostgreSQL)


---

## GIA Group Design System

### Color Palette

```css
/* Primary */
--primary-dark: #0A1F44;      /* Dark navy blue */
--primary-light: #00B4D8;     /* Cyan blue */

/* Secondary */
--white: #FFFFFF;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-900: #1A1A1A;

/* Status */
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--info: #3B82F6;
```

### Typography
- **Main font:** Inter, system-ui, sans-serif
- **Titles:** font-bold
- **Body:** font-normal

---

## Features

### MVP (Minimum Viable Product)

#### User
- [x] Registration / Login
- [x] Vehicle catalog with filters
- [x] Vehicle details
- [x] Reservation form
- [x] Availability check
- [x] User dashboard
- [x] Reservation history
- [x] Reservation modification/cancellation

#### admin
- [x] admin dashboard
- [x] Vehicle management (CRUD)
- [x] Reservation list
- [x] Reservation validation
- [x] Basic statistics

#### System
- [x] Email notifications
- [x] Date validation
- [x] Reservation conflict management
- [x] Responsive design

### Future features (if time permits)

- [ ] Online payment (Stripe sandbox)
- [ ] Vehicle geolocation
- [ ] PDF reservation export
- [ ] Review system
- [ ] Advanced statistical charts

---

## Installation

### Prerequisites
- Node.js 20+
- npm 
- Supabase account (free)
- Vercel account (free)
- Render account (free)

---

## Contact

**Developer :** Epanti Awoum Franc Junior
**Email :** francjuniorepanti@gmail.com
**GitHub :** github.com/jufrawep

---

## License

This project is developed as part of a technical test for GIA Group and any use requires the developer's approval

---

**Deadline :** February 15, 2026 at midnight
**Creation date:** February 5, 2026
