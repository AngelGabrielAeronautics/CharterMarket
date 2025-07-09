#!/usr/bin/env ts-node

import * as admin from 'firebase-admin';
import { UserRole } from '../lib/userCode';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Real airport data for realistic routes
const AIRPORTS = [
  { code: 'FAJS', name: 'OR Tambo International', city: 'Johannesburg', country: 'South Africa' },
  { code: 'FACT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa' },
  { code: 'FADN', name: 'King Shaka International', city: 'Durban', country: 'South Africa' },
  { code: 'FALE', name: 'Lanseria International', city: 'Johannesburg', country: 'South Africa' },
  { code: 'FBSK', name: 'Sir Seretse Khama International', city: 'Gaborone', country: 'Botswana' },
  { code: 'FVFA', name: 'Victoria Falls Airport', city: 'Victoria Falls', country: 'Zimbabwe' },
  { code: 'FYWH', name: 'Hosea Kutako International', city: 'Windhoek', country: 'Namibia' },
  { code: 'FMMI', name: 'Sir Seewoosagur Ramgoolam International', city: 'Port Louis', country: 'Mauritius' },
  { code: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'EGLL', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'KJFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  { code: 'KLAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
];

// Aircraft types for operators
const AIRCRAFT_TYPES = [
  { make: 'CESSNA', model: 'Citation XLS+', category: 'Light Jet', maxPassengers: 9, range: 2100 },
  { make: 'EMBRAER', model: 'Phenom 300E', category: 'Light Jet', maxPassengers: 8, range: 2010 },
  { make: 'BOMBARDIER', model: 'Challenger 350', category: 'Midsize Jet', maxPassengers: 10, range: 3200 },
  { make: 'BOMBARDIER', model: 'Global 6000', category: 'Heavy Jet', maxPassengers: 13, range: 6000 },
  { make: 'GULFSTREAM', model: 'G650ER', category: 'Heavy Jet', maxPassengers: 18, range: 7500 },
  { make: 'DASSAULT', model: 'Falcon 7X', category: 'Heavy Jet', maxPassengers: 14, range: 5950 },
  { make: 'BEECHCRAFT', model: 'King Air 350i', category: 'Turboprop', maxPassengers: 11, range: 1800 },
];

// Sample names for realistic user generation
const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'John', 'Amanda', 'Robert', 'Jennifer',
  'William', 'Ashley', 'Richard', 'Jessica', 'Charles', 'Michelle', 'Thomas', 'Kimberly', 'Christopher', 'Amy'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const COMPANY_NAMES = [
  'Luxury Jets International', 'Executive Air Services', 'Premium Aviation Group', 'Sky Elite Charter',
  'Global Wings', 'Platinum Air', 'Diamond Jet Services', 'Royal Flight Solutions', 'Elite Air Charter',
  'Premier Aviation Services', 'Exclusive Jets', 'VIP Air Solutions', 'Crown Aviation', 'Sterling Air Charter'
];

const TRAVEL_AGENCIES = [
  'Elite Travel Solutions', 'Luxury Travel Partners', 'Global Business Travel', 'Premier Travel Services',
  'Executive Travel Group', 'Platinum Travel Solutions', 'Diamond Travel Specialists', 'Crown Travel Services'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUserCode(role: UserRole, lastName: string): string {
  const prefix = role === 'passenger' ? 'PA' : 
                 role === 'agent' ? 'AG' : 
                 role === 'operator' ? 'OP' : 'AD';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const name = lastName.substring(0, 4).toUpperCase();
  return `${prefix}-${name}-${suffix}`;
}

function generateRegistration(): string {
  const prefix = 'ZS-'; // South African registration
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${suffix}`;
}

function generateRandomDate(daysBack: number, daysForward: number): Date {
  const today = new Date();
  const start = new Date(today.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  const end = new Date(today.getTime() + (daysForward * 24 * 60 * 60 * 1000));
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateTestData() {
  console.log('🚀 Starting comprehensive test data generation...\n');

  const batch = db.batch();
  const createdData = {
    users: [] as any[],
    aircraft: [] as any[],
    quoteRequests: [] as any[],
    offers: [] as any[]
  };

  // Create 20 diverse user accounts
  console.log('👥 Creating 20 user accounts...');
  
  for (let i = 0; i < 20; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const role = i < 8 ? 'passenger' : 
                 i < 12 ? 'agent' : 
                 i < 18 ? 'operator' : 'admin';
    
    const userCode = generateUserCode(role as UserRole, lastName);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@charter-test.com`;
    
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password: 'TestPassword123!',
        displayName: `${firstName} ${lastName}`,
        emailVerified: true
      });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role,
        userCode
      });

      // Create user document
      const userData = {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        role: role as UserRole,
        userCode,
        company: role === 'operator' ? getRandomElement(COMPANY_NAMES) : 
                 role === 'agent' ? getRandomElement(TRAVEL_AGENCIES) : null,
        phone: `+27 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        emailVerified: true,
        lastReminderSent: null,
        reminderCount: 0,
        profileIncompleteDate: null,
        permissions: role === 'admin' ? {
          userManagement: true,
          bookingManagement: true,
          financialAccess: true,
          systemConfig: false,
          contentManagement: true
        } : undefined
      };

      const userRef = db.collection('users').doc(userCode);
      batch.set(userRef, userData);
      createdData.users.push({ userCode, email, role, firstName, lastName });

      console.log(`   ✅ Created ${role}: ${firstName} ${lastName} (${email})`);

      // Create aircraft for operators
      if (role === 'operator') {
        const aircraftCount = Math.floor(Math.random() * 4) + 2; // 2-5 aircraft per operator
        
        for (let j = 0; j < aircraftCount; j++) {
          const aircraftType = getRandomElement(AIRCRAFT_TYPES);
          const aircraftId = `AC-${userCode}-${j + 1}`;
          const registration = generateRegistration();
          
          const aircraftData = {
            id: aircraftId,
            operatorUserCode: userCode,
            registration,
            make: aircraftType.make,
            model: aircraftType.model,
            category: aircraftType.category,
            maxPassengers: aircraftType.maxPassengers,
            range: aircraftType.range,
            year: Math.floor(Math.random() * 8) + 2017, // 2017-2024
            baseAirport: getRandomElement(AIRPORTS.slice(0, 4)).code, // SA airports
            status: Math.random() > 0.1 ? 'ACTIVE' : 'MAINTENANCE',
            documents: {
              airworthinessValid: true,
              registrationValid: true,
              insuranceValid: true,
              airworthinessExpiry: admin.firestore.Timestamp.fromDate(generateRandomDate(-30, 365)),
              registrationExpiry: admin.firestore.Timestamp.fromDate(generateRandomDate(-30, 730)),
              insuranceExpiry: admin.firestore.Timestamp.fromDate(generateRandomDate(-30, 365))
            },
            maintenance: {
              lastMaintenance: admin.firestore.Timestamp.fromDate(generateRandomDate(90, 0)),
              nextMaintenance: admin.firestore.Timestamp.fromDate(generateRandomDate(0, 180)),
              flightHours: Math.floor(Math.random() * 3000) + 500,
              flightCycles: Math.floor(Math.random() * 2000) + 200
            },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
          };

          const aircraftRef = db.collection('aircraft').doc(aircraftId);
          batch.set(aircraftRef, aircraftData);
          createdData.aircraft.push({ id: aircraftId, registration, operator: userCode });
          
          console.log(`      ✈️  Added aircraft: ${registration} (${aircraftType.make} ${aircraftType.model})`);
        }
      }

    } catch (authError) {
      console.warn(`   ⚠️  Failed to create auth user ${email}:`, authError);
      continue;
    }
  }

  // Get created users for generating relationships
  const passengerUsers = createdData.users.filter(u => u.role === 'passenger');
  const agentUsers = createdData.users.filter(u => u.role === 'agent');
  const operatorUsers = createdData.users.filter(u => u.role === 'operator');

  console.log('\n📋 Creating quote requests and offers...');

  // Create quote requests and offers
  for (let i = 0; i < 30; i++) {
    const requestor = Math.random() > 0.5 ? getRandomElement(passengerUsers) : getRandomElement(agentUsers);
    const departureAirport = getRandomElement(AIRPORTS);
    const arrivalAirport = getRandomElement(AIRPORTS.filter(a => a.code !== departureAirport.code));
    
    const requestCode = `QR-${requestor.userCode}-${Date.now()}-${i}`;
    const requestId = `req-${i + 1}`;
    
    const quoteRequestData = {
      id: requestId,
      requestCode,
      clientUserCode: requestor.userCode,
      routing: {
        legs: [{
          legNumber: 1,
          departureAirport: departureAirport.code,
          arrivalAirport: arrivalAirport.code,
          departureDate: admin.firestore.Timestamp.fromDate(generateRandomDate(1, 60)),
          isReturn: false
        }]
      },
      passengerCount: Math.floor(Math.random() * 12) + 1,
      preferences: {
        cabinClass: getRandomElement(['economy', 'premium', 'business', 'first']),
        flexibleDates: Math.random() > 0.5,
        specialRequirements: Math.random() > 0.7 ? 'Catering required' : null
      },
      status: 'active',
      createdAt: admin.firestore.Timestamp.fromDate(generateRandomDate(30, 0)),
      updatedAt: admin.firestore.Timestamp.now(),
      offers: []
    };

    const requestRef = db.collection('quoteRequests').doc(requestId);
    batch.set(requestRef, quoteRequestData);
    createdData.quoteRequests.push({ id: requestId, requestCode });

    console.log(`   📝 Created quote request: ${requestCode} (${departureAirport.code} → ${arrivalAirport.code})`);

    // Create offers from random operators
    const offerCount = Math.floor(Math.random() * 3) + 1; // 1-3 offers per request
    const selectedOperators = operatorUsers
      .sort(() => 0.5 - Math.random())
      .slice(0, offerCount);

    selectedOperators.forEach((operator, offerIndex) => {
      const offerId = `offer-${i}-${offerIndex}`;
      const basePrice = Math.floor(Math.random() * 50000) + 10000;
      const commission = Math.floor(basePrice * 0.03);
      
      const submissionTime = new Date(quoteRequestData.createdAt.toDate().getTime() + Math.random() * 72 * 60 * 60 * 1000);
      const responseTimeMinutes = Math.floor((submissionTime.getTime() - quoteRequestData.createdAt.toDate().getTime()) / (1000 * 60));
      
      const offerData = {
        id: offerId,
        requestId,
        operatorUserCode: operator.userCode,
        aircraft: createdData.aircraft.find(a => a.operator === operator.userCode)?.registration || 'ZS-TEST',
        pricing: {
          basePrice,
          commission,
          totalPrice: basePrice + commission,
          currency: 'USD'
        },
        responseTimeMinutes,
        submittedAt: admin.firestore.Timestamp.fromDate(submissionTime),
        status: Math.random() > 0.8 ? 'accepted' : 'submitted',
        createdAt: admin.firestore.Timestamp.fromDate(submissionTime),
        updatedAt: admin.firestore.Timestamp.fromDate(submissionTime)
      };

      const offerRef = db.collection('offers').doc(offerId);
      batch.set(offerRef, offerData);
      createdData.offers.push({ id: offerId, requestId, operator: operator.userCode });
      
      console.log(`      💰 Added offer from ${operator.firstName} ${operator.lastName}: $${basePrice.toLocaleString()}`);
    });
  }

  // Commit all changes
  console.log('\n💾 Committing data to Firestore...');
  await batch.commit();

  console.log('\n🎉 Test data generation completed successfully!\n');
  
  console.log('📊 SUMMARY:');
  console.log(`   👥 Users: ${createdData.users.length}`);
  console.log(`   ✈️  Aircraft: ${createdData.aircraft.length}`);
  console.log(`   📋 Quote Requests: ${createdData.quoteRequests.length}`);
  console.log(`   💰 Offers: ${createdData.offers.length}\n`);
  
  console.log('👑 USER BREAKDOWN:');
  const usersByRole = {
    passengers: createdData.users.filter(u => u.role === 'passenger').length,
    agents: createdData.users.filter(u => u.role === 'agent').length,
    operators: createdData.users.filter(u => u.role === 'operator').length,
    admins: createdData.users.filter(u => u.role === 'admin').length
  };
  console.log(`   🚶 Passengers: ${usersByRole.passengers}`);
  console.log(`   💼 Agents: ${usersByRole.agents}`);
  console.log(`   ✈️  Operators: ${usersByRole.operators}`);
  console.log(`   👑 Admins: ${usersByRole.admins}\n`);
  
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log(`   📧 Sample Email: ${createdData.users[0]?.email}`);
  console.log(`   🔑 Password: TestPassword123!`);
  console.log(`   ℹ️  Note: All test users have the same password\n`);
  
  console.log('🗑️  Remember to clean up this test data when done testing!');
}

// Run the script
generateTestData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }); 