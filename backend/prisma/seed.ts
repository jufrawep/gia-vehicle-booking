/**
 * DATABASE SEED SCRIPT
 * * Purpose: Populates the database with initial functional data for testing and development.
 * Includes: Admin account, test users, diverse vehicle fleet, and sample bookings.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  try {
    // -------------------------------------------------------------------------
    // 1. DATABASE CLEANUP
    // -------------------------------------------------------------------------
    // Order is crucial due to Foreign Key constraints (Bookings must be deleted first)
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    // -------------------------------------------------------------------------
    // 2. USER AUTHENTICATION SETUP
    // -------------------------------------------------------------------------
    const saltRounds = 12;
    const adminPassword = await bcrypt.hash("admin123", saltRounds);
    const userPassword = await bcrypt.hash("user123", saltRounds);

    // Create Corporate Administrator
    const admin = await prisma.user.create({
      data: {
        email: "admin@giagroup.net",
        password_hash: adminPassword,
        first_name: "Admin",
        last_name: "GIA",
        phone: "+237672969799",
        role: "admin",
        is_active: true,
        email_verified: true,
      },
    });

    // Create Test Customer Profiles
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: "jean.dupont@example.com",
          password_hash: userPassword,
          first_name: "Jean",
          last_name: "Dupont",
          phone: "+237690123456",
          role: "user",
          is_active: true,
          email_verified: true,
        },
      }),
      prisma.user.create({
        data: {
          email: "marie.kamga@example.com",
          password_hash: userPassword,
          first_name: "Marie",
          last_name: "Kamga",
          phone: "+237677123456",
          role: "user",
          is_active: true,
          email_verified: true,
        },
      }),
    ]);

    // -------------------------------------------------------------------------
    // 3. VEHICLE FLEET SEEDING
    // -------------------------------------------------------------------------

    // Using an array and createMany/Promise.all for cleaner syntax and scalability
    const vehicleData = [
      {
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        reg: "LT-5678-CM",
        cat: "economy",
        rate: 25000,
        seats: 5,
        trans: "automatic",
        fuel: "petrol",
        img: "https://images.unsplash.com/photo-1623869675551-0f54dd31a3bc?w=800",
      },
      {
        brand: "Honda",
        model: "Accord",
        year: 2023,
        reg: "LT-2023-EF",
        cat: "comfort",
        rate: 40000,
        seats: 5,
        trans: "automatic",
        fuel: "hybrid",
        img: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
      },
      {
        brand: "Mercedes-Benz",
        model: "Classe E",
        year: 2023,
        reg: "LT-9999-CM",
        cat: "premium",
        rate: 60000,
        seats: 5,
        trans: "automatic",
        fuel: "petrol",
        img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
      },
      {
        brand: "BMW",
        model: "X5",
        year: 2024,
        reg: "LT-1234-CM",
        cat: "luxury",
        rate: 85000,
        seats: 7,
        trans: "automatic",
        fuel: "diesel",
        img: "https://images.unsplash.com/photo-1617531653520-bd6d925c4a59?w=800",
      },
    ];

    const vehicles = await Promise.all(
      vehicleData.map((v) =>
        prisma.vehicle.create({
          data: {
            brand: v.brand,
            model: v.model,
            year: v.year,
            registration_number: v.reg,
            category: v.cat,
            daily_rate: v.rate,
            seats: v.seats,
            transmission: v.trans,
            fuel_type: v.fuel,
            image_url: v.img,
            status: "available",
            location_address: "Douala, Cameroun",
            features: JSON.stringify([
              "A/C",
              "Bluetooth",
              "GPS",
              "Leather Interior",
            ]),
            mileage: Math.floor(Math.random() * 10000),
          },
        }),
      ),
    );

    // -------------------------------------------------------------------------
    // 4. SAMPLE BOOKINGS (Business Logic Demonstration)
    // -------------------------------------------------------------------------
    const today = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(today.getDate() + 3);
    const inTenDays = new Date();
    inTenDays.setDate(today.getDate() + 10);

    // confirmed booking for User 1
    await prisma.booking.create({
      data: {
        user_id: users[0].id,
        vehicle_id: vehicles[0].id,
        start_date: inThreeDays,
        end_date: inTenDays,
        total_days: 7,
        total_amount: Number(vehicles[0].daily_rate) * 7,
        status: "confirmed",
        payment_status: "paid",
        notes: "Business trip to Yaoundé.",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
     console.error("Critical Error during seeding:", error);
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    if (process.env.NODE_ENV === "development") {
     console.error("Uncaught Exception:", e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
