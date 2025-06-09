import { Timestamp } from 'firebase/firestore';
import {
  generateFlightGroupId,
  generateFlightNumber,
  parseFlightNumber,
  isValidFlightNumber,
  isValidFlightGroupId,
} from '@/lib/serials';
import { CreateFlightData, QuoteRequest, Offer } from '@/types/flight';
import { Booking } from '@/types/booking';

/**
 * Demo utility to test and demonstrate the flight system logic.
 * This class provides methods to showcase the entire flight lifecycle,
 * from quote request to flight creation with legs.
 */
export class FlightSystemDemo {
  /**
   * Runs a complete demonstration of the flight booking and numbering system.
   */
  static runFullDemo(): void {
    console.log('=== CHARTER FLIGHT SYSTEM DEMO ===\n');

    this.demonstrateBookingFlow();
    this.demonstrateFlightNumbering();
    this.demonstrateEmptyLegBooking();
    this.demonstrateMultipleBookingScenarios();

    console.log('\n=== SYSTEM BENEFITS ===\n');
    console.log('✓ Clear flight identification with leg support');
    console.log('✓ Empty leg monetization opportunities');
    console.log('✓ Shared flight cost optimization');
    console.log('✓ Aircraft utilization maximization');
    console.log('✓ Transparent pricing with commission tracking');
    console.log('✓ Scalable flight management system');
    console.log('\n=== DEMO COMPLETED ===');
  }

  /**
   * Demonstrates the four main steps of a booking.
   */
  static demonstrateBookingFlow(): void {
    console.log('--- BOOKING FLOW DEMONSTRATION ---\n');

    // Step 1: Quote Request
    const quoteRequest = this.createSampleQuoteRequest();
    console.log('STEP 1: Quote Request Created');
    console.log(
      `  - ID: ${quoteRequest.requestCode}, Route: ${quoteRequest.routing.departureAirport} → ${quoteRequest.routing.arrivalAirport}\n`
    );

    // Step 2: Quote (Offer)
    const offer = this.createSampleOffer(quoteRequest);
    console.log('STEP 2: Operator Offer Submitted');
    console.log(`  - ID: ${offer.offerId}, Price: $${offer.totalPrice.toLocaleString()}\n`);

    // Step 3: Booking
    const booking = this.createSampleBooking(quoteRequest, offer);
    console.log('STEP 3: Booking Confirmed');
    console.log(`  - ID: ${booking.bookingId}, Status: ${booking.status}\n`);

    // Step 4: Flight Creation
    this.demonstrateFlightCreation(booking);
  }

  /**
   * Demonstrates the flight numbering system.
   */
  static demonstrateFlightNumbering(): void {
    console.log('\n--- FLIGHT NUMBERING SYSTEM ---\n');

    const operatorUserCode = 'OP-JETS-DEMO';
    const flightGroupId = generateFlightGroupId(operatorUserCode);

    console.log('Flight Group ID:', flightGroupId);
    console.log('  - Format: FLT-{operatorUserCode}-{6 random alphanumeric}');
    console.log('  - Valid:', isValidFlightGroupId(flightGroupId));

    const leg1Number = generateFlightNumber(flightGroupId, 1);
    const leg2Number = generateFlightNumber(flightGroupId, 2);

    console.log('\nGenerated Flight Numbers (Legs):');
    console.log(`  - Leg 1: ${leg1Number}`);
    console.log(`  - Leg 2: ${leg2Number}`);

    const parsed = parseFlightNumber(leg1Number);
    if (parsed) {
      console.log('\nParsed Components (from Leg 1):');
      console.log(`  - Group ID: ${parsed.flightGroupId}`);
      console.log(`  - Operator: ${parsed.operatorUserCode}`);
      console.log(`  - Leg: ${parsed.legNumber}`);
    }
  }

  /**
   * Demonstrates the concept and benefits of empty leg booking.
   */
  static demonstrateEmptyLegBooking(): void {
    console.log('\n--- EMPTY LEG BOOKING SCENARIO ---\n');

    console.log('Scenario: A flight from JFK to LAX is booked.');
    console.log('  - Leg 1 (JFK → LAX) is a "passenger" leg.');
    console.log('  - The return flight, Leg 2 (LAX → JFK), is an "empty" leg.');

    console.log('\nBenefits of Empty Legs:');
    console.log('  - Operators can sell the empty return flight, reducing waste.');
    console.log('  - Passengers can find and book these empty legs at a discount.');
    console.log('  - This maximizes aircraft utilization and revenue.');

    console.log('\nBooking Process:');
    console.log('  1. A new customer searches for flights from LAX to JFK.');
    console.log('  2. The system identifies the available empty leg.');
    console.log('  3. The customer books it, turning the "empty" leg into a "passenger" leg.');
  }

  /**
   * Shows various complex booking scenarios.
   */
  static demonstrateMultipleBookingScenarios(): void {
    console.log('\n--- ADVANCED BOOKING SCENARIOS ---\n');

    console.log('1. Shared Passenger Leg:');
    console.log('   Multiple bookings can be added to the same flight leg until');
    console.log("   the aircraft's passenger capacity is reached.");

    console.log('\n2. Multi-Leg Journey:');
    console.log('   A trip from JFK → MIA → LAX would create two passenger legs');
    console.log('   under the same flight group ID.');
  }

  // --- Helper methods to create sample data ---

  private static demonstrateFlightCreation(booking: Booking): void {
    console.log('STEP 4: Flight with Legs Created');
    const flightGroupId = generateFlightGroupId(booking.operator.operatorUserCode);
    const leg1FlightNumber = generateFlightNumber(flightGroupId, 1);
    const leg2FlightNumber = generateFlightNumber(flightGroupId, 2);

    console.log(`  - Flight Group ID: ${flightGroupId}`);
    console.log(
      `  - Leg 1 (Passenger): ${leg1FlightNumber} (${booking.routing.departureAirport} → ${booking.routing.arrivalAirport})`
    );
    console.log(
      `  - Leg 2 (Empty): ${leg2FlightNumber} (${booking.routing.arrivalAirport} → ${booking.routing.departureAirport})`
    );
  }

  private static createSampleQuoteRequest(): QuoteRequest {
    return {
      id: 'qr_sample_001',
      requestCode: 'QR-CLIENT-USER-20241201-A1B2',
      clientUserCode: 'CLIENT-USER',
      tripType: 'oneWay',
      routing: {
        departureAirport: 'KJFK',
        arrivalAirport: 'KLAX',
        departureAirportName: 'John F. Kennedy International Airport',
        arrivalAirportName: 'Los Angeles International Airport',
        departureDate: Timestamp.fromDate(new Date('2024-12-15T10:00:00Z')),
        flexibleDates: false,
      },
      passengerCount: 6,
      status: 'submitted',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  private static createSampleOffer(quoteRequest: QuoteRequest): Offer {
    const basePrice = 45000;
    const commission = basePrice * 0.03;
    return {
      offerId: 'QT-OP-JETS-20241201-A1B2',
      operatorUserCode: 'OP-JETS',
      clientUserCode: quoteRequest.clientUserCode,
      price: basePrice,
      commission: commission,
      totalPrice: basePrice + commission,
      offerStatus: 'accepted-by-client',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  private static createSampleBooking(quoteRequest: QuoteRequest, offer: Offer): Booking {
    return {
      id: 'booking_sample_001',
      bookingId: 'BK-OP-JETS-20241201-C3D4',
      requestId: quoteRequest.id,
      quoteId: offer.offerId,
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      routing: quoteRequest.routing,
      flightDetails: {},
      clientId: quoteRequest.clientUserCode,
      operator: {
        operatorUserCode: offer.operatorUserCode,
        operatorName: 'Premium Jets LLC',
      },
      aircraft: {
        id: 'AC-OP-JETS-G650',
        registration: 'N123PJ',
        make: 'Gulfstream',
        model: 'G650',
        maxPassengers: 14,
        category: 'Heavy Jet',
      },
      clientPreferences: {},
      cabinClass: 'premium',
      passengerCount: quoteRequest.passengerCount,
      passengers: [],
      payment: {
        subtotal: offer.price,
        commission: offer.commission,
        totalAmount: offer.totalPrice,
        amountPaid: offer.totalPrice,
        amountPending: 0,
        currency: 'USD',
      },
      documents: {},
      originalRequest: {
        requestCode: quoteRequest.requestCode,
        submittedAt: quoteRequest.createdAt,
        flexibleDates: quoteRequest.routing.flexibleDates,
      },
      acceptedQuote: {
        offerId: offer.offerId,
        submittedAt: offer.createdAt,
      },
    };
  }
}

/**
 * Runs the flight system demo. Can be triggered from a test script or CLI.
 */
export function runDemo(): void {
  try {
    FlightSystemDemo.runFullDemo();
  } catch (error) {
    console.error('Flight demo failed:', error);
  }
}
