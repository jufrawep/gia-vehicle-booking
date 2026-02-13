/**
 * DATABASE SEED SCRIPT
 * * Purpose: Populates the database with initial functional data for testing and development.
 * Includes: Admin account, test users, diverse vehicle fleet, and sample bookings.
 * 
 * IMPORTANT: 
 * - All enums use SCREAMING_SNAKE_CASE (matches PostgreSQL)
 * - Field names follow Prisma schema exactly (snake_case)
 * - Admin with empty permissions array = super-admin
 */

import { PrismaClient, Role, AdminPermission, VehicleCategory, Transmission, FuelType, VehicleStatus, BookingStatus, PaymentStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  try {
    // -------------------------------------------------------------------------
    // 1. DATABASE CLEANUP
    // -------------------------------------------------------------------------
    // Order is crucial due to Foreign Key constraints
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();


    // -------------------------------------------------------------------------
    // 2. USER AUTHENTICATION SETUP
    // -------------------------------------------------------------------------
    console.log("👥 Creating users...");
    const saltRounds = 12;
    const adminPassword = await bcrypt.hash("admin123", saltRounds);
    const userPassword = await bcrypt.hash("user123", saltRounds);

    // Create Corporate Administrator (Super-admin: empty permissions array)
    const admin = await prisma.user.create({
      data: {
        email: "admin@giagroup.net",
        password: adminPassword,         
        first_name: "Admin",
        last_name: "GIA",
        phone: "+237672969799",
        role: Role.ADMIN,               
        permissions: [],                
        status: UserStatus.ACTIVE,     
        is_active: true,
      },
    });

    // Create Test Customer Profiles
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: "jean.dupont@example.com",
          password: userPassword,
          first_name: "Jean",
          last_name: "Dupont",
          phone: "+237690123456",
          role: Role.USER,              
          status: UserStatus.ACTIVE,
          email_verified: true,
          is_active: true,
        },
      }),
      prisma.user.create({
        data: {
          email: "marie.kamga@example.com",
          password: userPassword,
          first_name: "Marie",
          last_name: "Kamga",
          phone: "+237677123456",
          role: Role.USER,
          status: UserStatus.ACTIVE,
          email_verified: true,
          is_active: true,
        },
      }),
    ]);

    // -------------------------------------------------------------------------
    // 3. VEHICLE FLEET SEEDING
    // -------------------------------------------------------------------------
    const vehicleData = [
      {
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        license_plate: "LT-5678-CM",    
        category: VehicleCategory.ECONOMY, 
        price_per_day: 25000,          
        seats: 5,
        transmission: Transmission.AUTOMATIC, 
        fuel_type: FuelType.PETROL,     
        image_url: "https://images.unsplash.com/photo-1623869675551-0f54dd31a3bc?w=800",
        status: VehicleStatus.AVAILABLE, 
        features: ["A/C", "Bluetooth", "GPS", "Leather Interior"],
        mileage: 4500,
        location_address: "Douala, Cameroun",
      },
      {
        brand: "Honda",
        model: "Accord",
        year: 2023,
        license_plate: "LT-2023-EF",
        category: VehicleCategory.COMFORT,
        price_per_day: 40000,
        seats: 5,
        transmission: Transmission.AUTOMATIC,
        fuel_type: FuelType.HYBRID,     
        image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
        status: VehicleStatus.AVAILABLE,
        features: ["A/C", "Bluetooth", "GPS", "Sunroof", "Heated Seats"],
        mileage: 3200,
        location_address: "Douala, Cameroun",
      },
      {
        brand: "Mercedes-Benz",
        model: "Classe E",
        year: 2023,
        license_plate: "LT-9999-CM",
        category: VehicleCategory.LUXURY, 
        price_per_day: 60000,
        seats: 5,
        transmission: Transmission.AUTOMATIC,
        fuel_type: FuelType.PETROL,
        image_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
        status: VehicleStatus.AVAILABLE,
        features: ["A/C", "Bluetooth", "GPS", "Massage Seats", "Ambient Lighting"],
        mileage: 1800,
        location_address: "Douala, Cameroun",
      },
      {
        brand: "BMW",
        model: "X5",
        year: 2024,
        license_plate: "LT-1234-CM",
        category: VehicleCategory.SUV,  
        price_per_day: 85000,
        seats: 7,
        transmission: Transmission.AUTOMATIC,
        fuel_type: FuelType.DIESEL,    
        image_url: "https://images.unsplash.com/photo-1617531653520-bd6d925c4a59?w=800",
        status: VehicleStatus.AVAILABLE,
        features: ["A/C", "Bluetooth", "GPS", "7-Seats", "4x4", "Third Row"],
        mileage: 1200,
        location_address: "Douala, Cameroun",
      },
    ];

    const vehicles = await Promise.all(
      vehicleData.map((v) =>
        prisma.vehicle.create({
          data: {
            brand: v.brand,
            model: v.model,
            year: v.year,
            license_plate: v.license_plate,
            category: v.category,
            price_per_day: v.price_per_day,
            seats: v.seats,
            transmission: v.transmission,
            fuel_type: v.fuel_type,
            image_url: v.image_url,
            status: v.status,
            features: JSON.stringify(v.features),
            mileage: v.mileage,
            location_address: v.location_address,
            is_available: true,         
            is_active: true,
          },
        })
      )
    );

    // -------------------------------------------------------------------------
    // 4. SAMPLE BOOKINGS (Business Logic Demonstration)
    // -------------------------------------------------------------------------
    console.log("📅 Creating sample bookings...");
    const today = new Date();
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);
    const inTenDays = new Date(today);
    inTenDays.setDate(today.getDate() + 10);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);

    // Confirmed booking (future)
    await prisma.booking.create({
      data: {
        user_id: users[0].id,
        vehicle_id: vehicles[0].id,
        start_date: inThreeDays,
        end_date: inTenDays,
        total_days: 7,
        total_price: Number(vehicles[0].price_per_day) * 7, 
        status: BookingStatus.CONFIRMED,  
        payment_status: PaymentStatus.COMPLETED,
        notes: "Business trip to Yaoundé.",
        pickup_location: "Aéroport Douala",
        dropoff_location: "Hôtel Hilton Yaoundé",
      },
    });

    // Completed booking (past)
    await prisma.booking.create({
      data: {
        user_id: users[0].id,
        vehicle_id: vehicles[1].id,
        start_date: lastMonth,
        end_date: lastWeek,
        total_days: 21,
        total_price: Number(vehicles[1].price_per_day) * 21,
        status: BookingStatus.COMPLETED, 
        payment_status: PaymentStatus.COMPLETED,
        notes: "Family vacation",
        pickup_location: "Douala",
        dropoff_location: "Kribi",
      },
    });

    // Pending booking (awaiting confirmation)
    await prisma.booking.create({
      data: {
        user_id: users[1].id,
        vehicle_id: vehicles[2].id,
        start_date: inThreeDays,
        end_date: inTenDays,
        total_days: 7,
        total_price: Number(vehicles[2].price_per_day) * 7,
        status: BookingStatus.PENDING,    
        payment_status: PaymentStatus.PENDING,
        notes: "Wedding anniversary",
        pickup_location: "Douala",
        dropoff_location: "Douala",
      },
    });



  } catch (error) {
    console.error("Critical Error during seeding:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Uncaught Exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });