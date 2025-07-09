import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { UserRole } from '@/lib/userCode';

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not available' }, { status: 500 });
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.role || !['admin', 'superAdmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const batch = adminDb.batch();
    const createdData = {
      users: [] as any[],
      aircraft: [] as any[],
      quoteRequests: [] as any[],
      offers: [] as any[],
      bookings: [] as any[],
      passengers: [] as any[],
      invoices: [] as any[]
    };

    // Create 20 diverse user accounts
    const userRoles: UserRole[] = ['passenger', 'agent', 'operator', 'admin'];
    
    for (let i = 0; i < 20; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const role = i < 8 ? 'passenger' : 
                   i < 12 ? 'agent' : 
                   i < 18 ? 'operator' : 'admin';
      
      const userCode = generateUserCode(role as UserRole, lastName);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@charter-test.com`;
      
      // Create Firebase Auth user
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password: 'TestPassword123!',
          displayName: `${firstName} ${lastName}`,
          emailVerified: true
        });

        // Set custom claims
        await adminAuth.setCustomUserClaims(userRecord.uid, {
          role,
          userCode
        });

        // Create user document
        const userData: any = {
          uid: userRecord.uid,
          email,
          firstName,
          lastName,
          role: role as UserRole,
          userCode,
          company: role === 'operator' ? getRandomElement(COMPANY_NAMES) : 
                   role === 'agent' ? getRandomElement(TRAVEL_AGENCIES) : null,
          phone: `+27 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          emailVerified: true,
          lastReminderSent: null,
          reminderCount: 0,
          profileIncompleteDate: null,
          status: 'active',
          isProfileComplete: true
        };

        // Only add permissions for admin users
        if (role === 'admin') {
          userData.permissions = {
            userManagement: true,
            bookingManagement: true,
            financialAccess: true,
            systemConfig: false,
            contentManagement: true
          };
        }

        const userRef = adminDb.collection('users').doc(userCode);
        batch.set(userRef, userData);
        createdData.users.push({ userCode, email, role });

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
                airworthinessExpiry: Timestamp.fromDate(generateRandomDate(-30, 365)),
                registrationExpiry: Timestamp.fromDate(generateRandomDate(-30, 730)),
                insuranceExpiry: Timestamp.fromDate(generateRandomDate(-30, 365))
              },
              maintenance: {
                lastMaintenance: Timestamp.fromDate(generateRandomDate(90, 0)),
                nextMaintenance: Timestamp.fromDate(generateRandomDate(0, 180)),
                flightHours: Math.floor(Math.random() * 3000) + 500,
                flightCycles: Math.floor(Math.random() * 2000) + 200
              },
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };

            const aircraftRef = adminDb.collection('aircraft').doc(aircraftId);
            batch.set(aircraftRef, aircraftData);
            createdData.aircraft.push({ id: aircraftId, registration, operator: userCode });
          }
        }

      } catch (authError) {
        console.warn(`Failed to create auth user ${email}:`, authError);
        // Continue with next user
        continue;
      }
    }

    // Get created users for generating relationships
    const passengerUsers = createdData.users.filter(u => u.role === 'passenger');
    const agentUsers = createdData.users.filter(u => u.role === 'agent');
    const operatorUsers = createdData.users.filter(u => u.role === 'operator');

    // Ensure we have users before creating quote requests
    const requestorUsers = [...passengerUsers, ...agentUsers];
    if (requestorUsers.length === 0 || operatorUsers.length === 0) {
      console.warn('Not enough users created to generate quote requests and offers');
    } else {
      // Create quote requests and offers
      const totalRequests = Math.min(30, requestorUsers.length * 5);
      const operatorOfferCounts = new Map(operatorUsers.map(op => [op.userCode, 0]));
      
      for (let i = 0; i < totalRequests; i++) {
        const requestor = getRandomElement(requestorUsers);
      const departureAirport = getRandomElement(AIRPORTS);
      const arrivalAirport = getRandomElement(AIRPORTS.filter(a => a.code !== departureAirport.code));
      
      const requestCode = `QR-${requestor.userCode}-${Date.now()}-${i}`;
      const requestId = `req-${i + 1}`;
      
      const departureDate = generateRandomDate(1, 60);
      const requestCreatedDate = generateRandomDate(30, 0);
      
      // Generate list of operators who will offer on this request
      // Ensure balanced distribution - prioritize operators with fewer offers
      const offerCount = Math.floor(Math.random() * 3) + 1; // 1-3 offers per request
      const sortedOperators = [...operatorUsers].sort((a, b) => {
        const countA = operatorOfferCounts.get(a.userCode) || 0;
        const countB = operatorOfferCounts.get(b.userCode) || 0;
        // Sort by offer count (ascending) with some randomness
        const countDiff = countA - countB;
        if (countDiff === 0) return Math.random() - 0.5;
        return countDiff;
      });
      
      const selectedOperators = sortedOperators.slice(0, offerCount);
      
      // Update operator offer counts
      selectedOperators.forEach(op => {
        operatorOfferCounts.set(op.userCode, (operatorOfferCounts.get(op.userCode) || 0) + 1);
      });
      
      const operatorUserCodesWhoHaveQuoted = selectedOperators.map(op => op.userCode);
      
      // Generate status first to use in conditional logic
      const requestStatus = (() => {
        const rand = Math.random();
        if (rand < 0.4) return 'submitted';
        if (rand < 0.6) return 'quote-received';
        if (rand < 0.75) return 'quotes-viewed';
        if (rand < 0.85) return 'accepted';
        if (rand < 0.92) return 'rejected';
        return 'expired';
      })();
      
      const quoteRequestData = {
        id: requestId,
        requestCode,
        clientUserCode: requestor.userCode,
        departureAirport: departureAirport.code,
        arrivalAirport: arrivalAirport.code,
        departureAirportName: `${departureAirport.name} (${departureAirport.code})`,
        arrivalAirportName: `${arrivalAirport.name} (${arrivalAirport.code})`,
        routing: {
          departureAirport: departureAirport.code,
          arrivalAirport: arrivalAirport.code,
          departureAirportName: `${departureAirport.name} (${departureAirport.code})`,
          arrivalAirportName: `${arrivalAirport.name} (${arrivalAirport.code})`,
          departureDate: Timestamp.fromDate(departureDate),
          flexibleDates: Math.random() > 0.5,
          legs: [{
            legNumber: 1,
            departureAirport: departureAirport.code,
            arrivalAirport: arrivalAirport.code,
            departureDate: Timestamp.fromDate(departureDate),
            isReturn: false
          }]
        },
        tripType: 'oneWay',
        passengerCount: Math.floor(Math.random() * 12) + 1,
        preferences: {
          cabinClass: getRandomElement(['economy', 'premium', 'business', 'first']),
          flexibleDates: Math.random() > 0.5,
          specialRequirements: Math.random() > 0.7 ? 'Catering required' : null
        },
        specialRequirements: Math.random() > 0.7 ? 'Catering required' : null,
        twinEngineMin: Math.random() > 0.8,
        flexibleDates: Math.random() > 0.5,
        status: requestStatus,
        operatorUserCodesWhoHaveQuoted,
        // For accepted requests, randomly assign one of the operators as the winner
        ...(requestStatus === 'accepted' && {
          acceptedOperatorUserCode: getRandomElement(selectedOperators).userCode
        }),
        createdAt: Timestamp.fromDate(requestCreatedDate),
        updatedAt: Timestamp.now(),
        offers: [] as any[],
        submittedAt: Timestamp.fromDate(requestCreatedDate),
        viewedBy: []
      };

      // Create offers from selected operators (use the same operators who were marked as having quoted)
      const embeddedOffers: any[] = [];
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
          submittedAt: Timestamp.fromDate(submissionTime),
          status: Math.random() > 0.8 ? 'accepted' : 'submitted',
          offerStatus: getRandomElement(['pending-client-acceptance', 'accepted-by-client', 'rejected-by-client']),
          createdAt: Timestamp.fromDate(submissionTime),
          updatedAt: Timestamp.fromDate(submissionTime)
        };

        // Create both standalone offer document and add to embedded array
        const offerRef = adminDb.collection('offers').doc(offerId);
        batch.set(offerRef, offerData);
        embeddedOffers.push(offerData);
        createdData.offers.push({ id: offerId, requestId, operator: operator.userCode });
      });

      // Update the quote request data to include embedded offers
      quoteRequestData.offers = embeddedOffers;

      const requestRef = adminDb.collection('quoteRequests').doc(requestId);
      batch.set(requestRef, quoteRequestData);
      createdData.quoteRequests.push({ id: requestId, requestCode });
      }
    }

    // Commit all changes
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Comprehensive test data created successfully',
      summary: {
        users: createdData.users.length,
        aircraft: createdData.aircraft.length,
        quoteRequests: createdData.quoteRequests.length,
        offers: createdData.offers.length
      },
      details: {
        usersByRole: {
          passengers: createdData.users.filter(u => u.role === 'passenger').length,
          agents: createdData.users.filter(u => u.role === 'agent').length,
          operators: createdData.users.filter(u => u.role === 'operator').length,
          admins: createdData.users.filter(u => u.role === 'admin').length
        },
        sampleCredentials: {
          email: createdData.users[0]?.email,
          password: 'TestPassword123!',
          note: 'All test users have the same password'
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating comprehensive test data:', error);
    return NextResponse.json(
      {
        error: 'Failed to create comprehensive test data',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 