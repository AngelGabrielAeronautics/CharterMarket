import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Flight,
  FlightLeg,
  CreateFlightData,
  FlightLegType,
  FlightLegStatus,
} from '@/types/flight';
import { Booking } from '@/types/booking';
import {
  generateFlightGroupId,
  generateFlightNumber,
  parseFlightNumber,
  isValidFlightNumber,
} from '@/lib/serials';

/**
 * Flight Service - Manages the complete flight lifecycle
 *
 * Flow: Quote Request → Quote (Offer) → Booking → Flight
 * - A quote request can have multiple offers
 * - An accepted offer becomes a booking
 * - One or more bookings make up a flight
 * - A flight can have multiple legs (passenger + empty legs)
 */
export class FlightService {
  /**
   * Creates a new flight with legs based on a booking
   * This is called when the first booking for a flight is confirmed/paid
   */
  static async createFlightFromBooking(
    booking: Booking,
    flightData: CreateFlightData
  ): Promise<Flight> {
    const batch = writeBatch(db);

    // Generate flight group ID
    const flightGroupId = generateFlightGroupId(flightData.operatorUserCode);

    // Create primary leg (the booked passenger leg)
    const primaryLeg: FlightLeg = {
      legNumber: 1,
      flightNumber: generateFlightNumber(flightGroupId, 1),
      legType: 'passenger',
      status: 'booked',
      departureAirport: flightData.primaryLeg.departureAirport,
      arrivalAirport: flightData.primaryLeg.arrivalAirport,
      departureAirportName: flightData.primaryLeg.departureAirportName,
      arrivalAirportName: flightData.primaryLeg.arrivalAirportName,
      scheduledDepartureTime: flightData.primaryLeg.scheduledDepartureTime,
      scheduledArrivalTime: flightData.primaryLeg.scheduledArrivalTime,
      bookingIds: flightData.primaryLeg.bookingIds,
      maxSeats: flightData.primaryLeg.maxSeats,
      availableSeats: flightData.primaryLeg.maxSeats - flightData.primaryLeg.bookingIds.length,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const legs: FlightLeg[] = [primaryLeg];
    let totalLegs = 1;

    // Create return/positioning leg if specified (empty leg)
    if (flightData.returnLeg) {
      const returnLeg: FlightLeg = {
        legNumber: 2,
        flightNumber: generateFlightNumber(flightGroupId, 2),
        legType: 'empty',
        status: 'available', // Available for booking by other passengers
        departureAirport: flightData.returnLeg.departureAirport,
        arrivalAirport: flightData.returnLeg.arrivalAirport,
        scheduledDepartureTime: flightData.returnLeg.scheduledDepartureTime,
        scheduledArrivalTime: flightData.returnLeg.scheduledArrivalTime,
        maxSeats: flightData.returnLeg.maxSeats,
        availableSeats: flightData.returnLeg.maxSeats, // All seats available
        bookingIds: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      legs.push(returnLeg);
      totalLegs = 2;
    }

    // Create the flight document
    const flight: Omit<Flight, 'id'> = {
      flightGroupId,
      operatorUserCode: flightData.operatorUserCode,
      aircraftId: flightData.aircraftId,
      legs,
      status: 'scheduled',
      totalLegs,
      primaryBookingId: flightData.primaryBookingId,
      originalQuoteRequestId: flightData.originalQuoteRequestId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add flight to Firestore
    const flightRef = doc(collection(db, 'flights'));
    batch.set(flightRef, flight);

    // Update booking with flight information
    const bookingRef = doc(db, 'bookings', booking.id);
    batch.update(bookingRef, {
      flightId: flightRef.id,
      'flightDetails.flightNumber': primaryLeg.flightNumber,
      updatedAt: Timestamp.now(),
    });

    await batch.commit();

    return {
      id: flightRef.id,
      ...flight,
    };
  }

  /**
   * Adds a booking to an existing flight leg (for shared flights or empty leg bookings)
   */
  static async addBookingToFlightLeg(
    flightId: string,
    legNumber: number,
    bookingId: string
  ): Promise<void> {
    const flightRef = doc(db, 'flights', flightId);
    const flightDoc = await getDoc(flightRef);

    if (!flightDoc.exists()) {
      throw new Error('Flight not found');
    }

    const flight = flightDoc.data() as Flight;
    const legIndex = flight.legs.findIndex((leg) => leg.legNumber === legNumber);

    if (legIndex === -1) {
      throw new Error(`Flight leg ${legNumber} not found`);
    }

    const leg = flight.legs[legIndex];

    // Check if seats are available
    if (!leg.availableSeats || leg.availableSeats <= 0) {
      throw new Error('No available seats on this flight leg');
    }

    // Update the leg
    const updatedLeg: FlightLeg = {
      ...leg,
      bookingIds: [...(leg.bookingIds || []), bookingId],
      availableSeats: leg.availableSeats - 1,
      legType: leg.legType === 'empty' && leg.bookingIds?.length === 0 ? 'passenger' : leg.legType,
      status: leg.status === 'available' ? 'booked' : leg.status,
      updatedAt: Timestamp.now(),
    };

    // Update flight document
    const updatedLegs = [...flight.legs];
    updatedLegs[legIndex] = updatedLeg;

    await updateDoc(flightRef, {
      legs: updatedLegs,
      updatedAt: Timestamp.now(),
    });

    // Update booking with flight information
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      flightId,
      'flightDetails.flightNumber': updatedLeg.flightNumber,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Finds available empty legs for a given route and date range
   */
  static async findAvailableEmptyLegs(
    departureAirport: string,
    arrivalAirport: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ flight: Flight; leg: FlightLeg }>> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Query flights with empty legs in the date range
    const flightsQuery = query(collection(db, 'flights'), where('status', '==', 'scheduled'));

    const flightsSnapshot = await getDocs(flightsQuery);
    const availableEmptyLegs: Array<{ flight: Flight; leg: FlightLeg }> = [];

    flightsSnapshot.forEach((doc) => {
      const flight = { id: doc.id, ...doc.data() } as Flight;

      flight.legs.forEach((leg) => {
        if (
          leg.legType === 'empty' &&
          leg.status === 'available' &&
          leg.availableSeats &&
          leg.availableSeats > 0 &&
          leg.departureAirport === departureAirport &&
          leg.arrivalAirport === arrivalAirport &&
          leg.scheduledDepartureTime >= startTimestamp &&
          leg.scheduledDepartureTime <= endTimestamp
        ) {
          availableEmptyLegs.push({ flight, leg });
        }
      });
    });

    return availableEmptyLegs.sort(
      (a, b) => a.leg.scheduledDepartureTime.toMillis() - b.leg.scheduledDepartureTime.toMillis()
    );
  }

  /**
   * Gets a flight by ID with all its legs
   */
  static async getFlightById(flightId: string): Promise<Flight | null> {
    const flightDoc = await getDoc(doc(db, 'flights', flightId));

    if (!flightDoc.exists()) {
      return null;
    }

    return {
      id: flightDoc.id,
      ...flightDoc.data(),
    } as Flight;
  }

  /**
   * Gets all flights for an operator
   */
  static async getFlightsByOperator(operatorUserCode: string): Promise<Flight[]> {
    const flightsQuery = query(
      collection(db, 'flights'),
      where('operatorUserCode', '==', operatorUserCode)
    );

    const flightsSnapshot = await getDocs(flightsQuery);
    return flightsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Flight[];
  }

  /**
   * Gets all flights from the system. FOR ADMIN/SUPERADMIN USE ONLY.
   */
  static async getAllFlights(): Promise<Flight[]> {
    const flightsQuery = query(collection(db, 'flights'));
    const flightsSnapshot = await getDocs(flightsQuery);
    return flightsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Flight[];
  }

  /**
   * Updates flight status
   */
  static async updateFlightStatus(flightId: string, status: Flight['status']): Promise<void> {
    const flightRef = doc(db, 'flights', flightId);
    await updateDoc(flightRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Updates a specific leg status
   */
  static async updateLegStatus(
    flightId: string,
    legNumber: number,
    status: FlightLegStatus
  ): Promise<void> {
    const flightRef = doc(db, 'flights', flightId);
    const flightDoc = await getDoc(flightRef);

    if (!flightDoc.exists()) {
      throw new Error('Flight not found');
    }

    const flight = flightDoc.data() as Flight;
    const legIndex = flight.legs.findIndex((leg) => leg.legNumber === legNumber);

    if (legIndex === -1) {
      throw new Error(`Flight leg ${legNumber} not found`);
    }

    const updatedLegs = [...flight.legs];
    updatedLegs[legIndex] = {
      ...updatedLegs[legIndex],
      status,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(flightRef, {
      legs: updatedLegs,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Records actual departure/arrival times for a leg
   */
  static async recordActualTimes(
    flightId: string,
    legNumber: number,
    actualDepartureTime?: Timestamp,
    actualArrivalTime?: Timestamp
  ): Promise<void> {
    const flightRef = doc(db, 'flights', flightId);
    const flightDoc = await getDoc(flightRef);

    if (!flightDoc.exists()) {
      throw new Error('Flight not found');
    }

    const flight = flightDoc.data() as Flight;
    const legIndex = flight.legs.findIndex((leg) => leg.legNumber === legNumber);

    if (legIndex === -1) {
      throw new Error(`Flight leg ${legNumber} not found`);
    }

    const updatedLegs = [...flight.legs];
    const updates: Partial<FlightLeg> = { updatedAt: Timestamp.now() };

    if (actualDepartureTime) {
      updates.actualDepartureTime = actualDepartureTime;
      updates.status = 'in-progress';
    }

    if (actualArrivalTime) {
      updates.actualArrivalTime = actualArrivalTime;
      updates.status = 'completed';
    }

    updatedLegs[legIndex] = {
      ...updatedLegs[legIndex],
      ...updates,
    };

    await updateDoc(flightRef, {
      legs: updatedLegs,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Gets flight information by flight number (including leg)
   */
  static async getFlightByNumber(
    flightNumber: string
  ): Promise<{ flight: Flight; leg: FlightLeg } | null> {
    const parsed = parseFlightNumber(flightNumber);
    if (!parsed) {
      return null;
    }

    const flightsQuery = query(
      collection(db, 'flights'),
      where('flightGroupId', '==', parsed.flightGroupId)
    );

    const flightsSnapshot = await getDocs(flightsQuery);

    if (flightsSnapshot.empty) {
      return null;
    }

    const flight = {
      id: flightsSnapshot.docs[0].id,
      ...flightsSnapshot.docs[0].data(),
    } as Flight;

    const leg = flight.legs.find((l) => l.legNumber === parsed.legNumber);

    if (!leg) {
      return null;
    }

    return { flight, leg };
  }
}
