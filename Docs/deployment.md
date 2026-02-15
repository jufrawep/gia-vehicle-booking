# Deployment & Usage Guide
## GIA Vehicle Booking System

---

## Prerequisites

| Tool | Minimum Version | Verification |
|---|---|---|
| Node.js | 18 LTS | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | 2.x | `git --version` |

---

## 1. Local Installation (Development)

### 1.1 Clone the Repository
```bash
git clone https://github.com/your-username/gia-vehicle-booking.git
cd gia-vehicle-booking
```

### 1.2 Backend Configuration
```bash
cd backend
npm install
```

Create the `.env` file at the root of the `backend/` folder:
```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gia_booking"

# JWT
JWT_SECRET=your_very_long_and_secure_jwt_secret
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@giagroup.net

# Frontend (for email links)
FRONTEND_URL=http://localhost:5173
```

### 1.3 Database Setup
```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE gia_booking;"

# Apply the Prisma schema
npx prisma db push

# (Optional) View the created tables
npx prisma studio
```

**Enums to verify** — If the database already existed, ensure that the enums are in UPPERCASE:
```sql
SELECT t.typname, e.enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
ORDER BY t.typname;
```
```sql
ALTER TABLE bookings DROP COLUMN payment_status;
DROP TYPE "PaymentStatus";
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED');
ALTER TABLE bookings ADD COLUMN payment_status "PaymentStatus" NOT NULL DEFAULT 'PENDING';
```

### 1.4 Create an Administrator Account
```bash
# Step 1 — Register via the application (POST /api/auth/register)
# Step 2 — Promote to admin via SQL:
psql -U postgres -d gia_booking -c "
  UPDATE users
  SET role = 'ADMIN', status = 'ACTIVE', permissions = '{}'
  WHERE email = 'your-admin@email.com';
"
```

> An empty `permissions` array `'{}'` = super-admin (full privileges).

### 1.5 Start the Backend
```bash
cd backend
npm run dev
# Server available at http://localhost:5000
```

### 1.6 Frontend Configuration
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 1.7 Start the Frontend
```bash
npm run dev
# Application available at http://localhost:5173
```

---

## 2. Application Usage

### 2.1 Customer Journey

1. **Home page** `localhost:5173` → presentation, featured vehicles
2. **Catalog** → `/vehicles` → filter by category, fuel type, price range
3. **Vehicle details** → click on a card → booking dates, summary
4. **Registration** → `/register` → form with validation
5. **Login** → `/login`
6. **My dashboard** → `/dashboard` → booking history and statuses
7. **Password reset** → `/forgot-password` → email with secure link (1h TTL)

### 2.2 Administrator Journey

1. Log in with an ADMIN account → automatic redirection to `/admin`
2. **Bookings tab**:
   - ✅ Confirm (PENDING → CONFIRMED)
   - 🏁 Complete (CONFIRMED → COMPLETED)
   - ❌ Cancel (PENDING or CONFIRMED → CANCELLED)
   - ⏳ Reset to pending (CANCELLED → PENDING)
3. **Vehicles tab**:
   - 👁 View details
   - ✏️ Edit (pre-filled form)
   - 🗑 Delete
   - ➕ Add new vehicle
4. **Users tab**:
   - 🚫 Block / ✅ Unblock account
   - 🛡 Promote to admin / 👤 Demote
   - 🗑 Delete account
5. **Payments tab**:
   - 📊 View all transactions
   - 🔍 Filter by date range, status, payment method
   - 💰 View revenue summary
   - 🎫 Access completed payment tickets

### 2.3 Language Switch

- Click on 🇫🇷 / 🇬🇧 in the navigation bar
- The change is **instant** across the entire application

---

## 3. Production Deployment (Linux VPS)

### 3.1 Server Prerequisites
```bash
# Ubuntu 22.04 LTS recommended
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql nginx git
sudo npm install -g pm2
```

### 3.2 Production Database
```bash
sudo -u postgres psql
CREATE USER gia_user WITH PASSWORD 'strong_password';
CREATE DATABASE gia_booking OWNER gia_user;
\q
```

### 3.3 Deploy the Application
```bash
git clone https://github.com/your-username/gia-vehicle-booking.git /var/www/gia
cd /var/www/gia

# Backend
cd backend
npm install --production
npx prisma generate
npx prisma db push
npm run build  # compile TypeScript → dist/

# Frontend
cd ../frontend
npm install
npm run build  # generates dist/
```

### 3.4 Start with PM2
```bash
cd /var/www/gia/backend
pm2 start dist/server.js --name "gia-backend"
pm2 startup
pm2 save
```

### 3.5 Nginx (Reverse Proxy + Frontend)
```nginx
# /etc/nginx/sites-available/gia
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React SPA)
    root /var/www/gia/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/gia /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3.6 SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 4. Environment Variables — Complete Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection URL |
| `JWT_SECRET` | ✅ | JWT secret key (min. 32 characters) |
| `JWT_EXPIRES_IN` | ✅ | Token validity duration (e.g., `7d`) |
| `SMTP_HOST` | ✅ | SMTP server |
| `SMTP_PORT` | ✅ | SMTP port (587 for TLS) |
| `SMTP_USER` | ✅ | Sender email address |
| `SMTP_PASS` | ✅ | SMTP password / App password |
| `EMAIL_FROM` | ✅ | Email address displayed in emails |
| `FRONTEND_URL` | ✅ | Frontend URL (for email links) |
| `PORT` | ⬜ | Server port (default: 5000) |
| `NODE_ENV` | ⬜ | `development` or `production` |

---

## 5. Useful Commands
```bash
# View real-time logs (production)
pm2 logs gia-backend

# Restart after changes
pm2 restart gia-backend

# View database state
npx prisma studio

# Regenerate Prisma client after schema modification
npx prisma generate

# Apply migrations
npx prisma db push
```

---

## 6. Troubleshooting

| Problem | Probable Cause | Solution |
|---|---|---|
| `invalid input value for enum "PaymentStatus"` | Corrupted PostgreSQL enum | Recreate enum (see section 1.3) |
| `invalid byte sequence for encoding "UTF8"` | Column type issue | `ALTER COLUMN ... TYPE TIMESTAMPTZ USING ...::timestamptz` |
| Email not received | Incorrect SMTP config | Check SMTP_HOST, SMTP_PASS, enable "App passwords" for Gmail |
| `Cannot find module '../types'` | Missing types/index.ts | Verify that `src/types/index.ts` exists |
| Blank page in production | SPA routing | Check Nginx `try_files` configuration |
| Payment not processing | Missing payment routes | Ensure payment.routes.ts is imported in server.ts |
| Ticket not displaying | Payment not found | Verify payment was created successfully in database |
| Double booking creation | Pending booking not cleared | Check localStorage cleanup in Login/Register |

---

## 7. Payment System Workflow

### 7.1 Payment Flow

1. **User creates booking** → Status: `CONFIRMED`, Payment Status: `PENDING`
2. **User clicks "Pay"** → Redirected to `/payment/:bookingId`
3. **PaymentPage loads** → Checks if payment already exists
   - If payment exists → Display ticket directly (Step 3)
   - If no payment → Show payment form (Steps 1-2)
4. **User fills card form** → Card validation (test cards available)
5. **Payment processed** → Creates Payment record, updates booking `payment_status`
6. **Confirmation email sent** → Contains ticket link and transaction details
7. **Ticket displayed** → Can be printed or downloaded as PDF

### 7.2 Test Cards

- ✅ **Any 16-digit number** (except ending in 0002) → **ACCEPTED**
- ❌ `**** **** **** 0002` → **DECLINED**

### 7.3 Accessing Tickets

Tickets can be accessed:
- From **User Dashboard** → Bookings tab → "Ticket" button (if paid)
- From **User Dashboard** → Payments tab → "Ticket" button
- Direct URL: `/payment/:bookingId` (auto-displays ticket if paid)
- Email confirmation link → Direct to ticket

### 7.4 Admin Payment Management

Admins can:
- View all payments in **Payments tab**
- Filter by date range, status, payment method
- See customer details and transaction info
- Track revenue statistics
- Access any completed payment ticket

---

## 8. Pending Booking Feature

### 8.1 How It Works

When a non-authenticated user tries to book:
1. Booking data saved to `localStorage`
2. User redirected to `/login` or `/register`
3. After successful authentication:
   - Booking automatically created from saved data
   - Success notification displayed
   - User redirected to dashboard
   - `localStorage` cleared

### 8.2 Data Saved
```javascript
{
  vehicleId: "uuid",
  startDate: "ISO-8601",
  endDate: "ISO-8601",
  notes: "string",
  vehicleInfo: {
    brand: "string",
    model: "string",
    imageUrl: "string"
  }
}
```

---

## 9. Email Notifications

### 9.1 Booking Confirmation Email

Sent when:
- New booking is created
- Status changes to `CONFIRMED`

Contains:
- Booking ID and dates
- Vehicle information
- Total price
- Pickup/dropoff details

### 9.2 Payment Confirmation Email

Sent when:
- Payment is successfully processed
- Status is `COMPLETED`

Contains:
- Transaction ID
- Payment amount and method
- Masked card number
- Direct link to ticket
- Security notice

### 9.3 Password Reset Email

Sent when:
- User requests password reset

Contains:
- Secure reset link (1-hour expiry)
- User information
- Security warning

---

## 10. Security Best Practices

### 10.1 Production Checklist

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Use strong database password
- [ ] Enable SSL/TLS with Let's Encrypt
- [ ] Set `NODE_ENV=production`
- [ ] Disable Prisma Studio in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Monitor logs with PM2
- [ ] Keep dependencies updated

### 10.2 Database Backups
```bash
# Manual backup
pg_dump -U gia_user gia_booking > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U gia_user gia_booking < backup_20260215.sql

# Automated daily backups (cron)
0 2 * * * pg_dump -U gia_user gia_booking > /backups/gia_$(date +\%Y\%m\%d).sql
```

---

*Document generated on February 15, 2026 — GIA Vehicle Booking System*