import { Timestamp } from 'firebase/firestore';
import { Booking, BookingStatus } from '@/types/booking';
import { CabinClass } from '@/types/flight';

// Create mock timestamps for dates
const getTimestamp = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return Timestamp.fromDate(date);
};

// Sample bookings data for testing using new comprehensive structure
export const mockBookings: Booking[] = [
  {
    id: 'booking1',
    bookingId: 'BK-OPJET-20230601-ABCD',
    requestId: 'req1',
    quoteId: 'quote1',
    status: 'confirmed' as BookingStatus,
    createdAt: getTimestamp(-3),
    updatedAt: getTimestamp(-1),

    routing: {
      departureAirport: 'FAJS', // Johannesburg
      arrivalAirport: 'FACT', // Cape Town
      departureDate: getTimestamp(7),
      flexibleDates: false,
    },

    flightDetails: {
      flightNumber: 'CH1234',
    },

    clientId: 'PA-SMIT-ABCD',

    operator: {
      operatorUserCode: 'OP-JETS-ABCD',
      operatorName: 'Luxury Jets',
    },

    aircraft: {
      id: 'aircraft1',
      registration: 'ZS-LUX',
      make: 'Cessna',
      model: 'Citation X',
      maxPassengers: 8,
      category: 'Light Jet',
    },

    clientPreferences: {
      preferredCabinClass: 'premium' as CabinClass,
    },

    cabinClass: 'premium' as CabinClass,
    passengerCount: 4,
    passengers: [],

    payment: {
      subtotal: 25000,
      commission: 750,
      totalAmount: 25750,
      amountPaid: 25750,
      amountPending: 0,
      currency: 'USD',
    },

    documents: {},

    originalRequest: {
      requestCode: 'QR-PA-SMIT-20230601-1234',
      submittedAt: getTimestamp(-5),
      flexibleDates: false,
    },

    acceptedQuote: {
      offerId: 'quote1',
      submittedAt: getTimestamp(-4),
    },

    checklistsCompleted: {
      operatorChecklist: true,
      clientChecklist: true,
      documentChecklist: true,
      paymentChecklist: true,
    },
  },
  {
    id: 'booking2',
    bookingId: 'BK-OPAIR-20230610-EFGH',
    requestId: 'req2',
    quoteId: 'quote2',
    status: 'pending-payment' as BookingStatus,
    createdAt: getTimestamp(-1),
    updatedAt: getTimestamp(-1),

    routing: {
      departureAirport: 'FACT', // Cape Town
      arrivalAirport: 'FALE', // Durban
      departureDate: getTimestamp(14),
      flexibleDates: true,
    },

    flightDetails: {
      flightNumber: 'CH5678',
    },

    clientId: 'PA-SMIT-ABCD',

    operator: {
      operatorUserCode: 'OP-AFRI-EFGH',
      operatorName: 'African Wings',
    },

    aircraft: {
      id: 'aircraft2',
      registration: 'ZS-AFR',
      make: 'King Air',
      model: '350',
      maxPassengers: 11,
      category: 'Turboprop',
    },

    clientPreferences: {
      preferredCabinClass: 'standard' as CabinClass,
    },

    cabinClass: 'standard' as CabinClass,
    passengerCount: 2,
    passengers: [],

    payment: {
      subtotal: 15000,
      commission: 450,
      totalAmount: 15450,
      amountPaid: 0,
      amountPending: 15450,
      currency: 'USD',
    },

    documents: {},

    originalRequest: {
      requestCode: 'QR-PA-SMIT-20230610-5678',
      submittedAt: getTimestamp(-2),
      flexibleDates: true,
    },

    acceptedQuote: {
      offerId: 'quote2',
      submittedAt: getTimestamp(-1),
    },

    checklistsCompleted: {
      operatorChecklist: false,
      clientChecklist: false,
      documentChecklist: false,
      paymentChecklist: false,
    },
  },
  {
    id: 'booking3',
    bookingId: 'BK-OPELI-20230515-IJKL',
    requestId: 'req3',
    quoteId: 'quote3',
    status: 'archived' as BookingStatus,
    createdAt: getTimestamp(-14),
    updatedAt: getTimestamp(-6),
    archivedAt: getTimestamp(-6),

    routing: {
      departureAirport: 'FAJS', // Johannesburg
      arrivalAirport: 'FBSK', // Gaborone
      departureDate: getTimestamp(-7),
      flexibleDates: false,
    },

    flightDetails: {
      flightNumber: 'CH9012',
    },

    clientId: 'PA-SMIT-ABCD',

    operator: {
      operatorUserCode: 'OP-EXEC-IJKL',
      operatorName: 'Executive Air',
    },

    aircraft: {
      id: 'aircraft3',
      registration: 'ZS-EXE',
      make: 'Gulfstream',
      model: 'G650',
      maxPassengers: 14,
      category: 'Heavy Jet',
    },

    clientPreferences: {
      preferredCabinClass: 'vip' as CabinClass,
    },

    cabinClass: 'vip' as CabinClass,
    passengerCount: 6,
    passengers: [],

    payment: {
      subtotal: 35000,
      commission: 1050,
      totalAmount: 36050,
      amountPaid: 36050,
      amountPending: 0,
      currency: 'USD',
    },

    documents: {},

    originalRequest: {
      requestCode: 'QR-PA-SMIT-20230515-9012',
      submittedAt: getTimestamp(-16),
      flexibleDates: false,
    },

    acceptedQuote: {
      offerId: 'quote3',
      submittedAt: getTimestamp(-15),
    },

    checklistsCompleted: {
      operatorChecklist: true,
      clientChecklist: true,
      documentChecklist: true,
      paymentChecklist: true,
    },
  },
  {
    id: 'booking4',
    bookingId: 'BK-OPSKY-20230620-MNOP',
    requestId: 'req4',
    quoteId: 'quote4',
    status: 'confirmed' as BookingStatus,
    createdAt: getTimestamp(-5),
    updatedAt: getTimestamp(-3),

    routing: {
      departureAirport: 'FALE', // Durban
      arrivalAirport: 'FAJS', // Johannesburg
      departureDate: getTimestamp(21),
      flexibleDates: true,
    },

    flightDetails: {
      flightNumber: 'CH3456',
    },

    clientId: 'PA-SMIT-ABCD',

    operator: {
      operatorUserCode: 'OP-PREM-MNOP',
      operatorName: 'Premium Jets',
    },

    aircraft: {
      id: 'aircraft4',
      registration: 'ZS-PRE',
      make: 'Embraer',
      model: 'Phenom 300',
      maxPassengers: 9,
      category: 'Light Jet',
    },

    clientPreferences: {
      preferredCabinClass: 'premium' as CabinClass,
    },

    cabinClass: 'premium' as CabinClass,
    passengerCount: 3,
    passengers: [],

    payment: {
      subtotal: 18000,
      commission: 540,
      totalAmount: 18540,
      amountPaid: 18540,
      amountPending: 0,
      currency: 'USD',
    },

    documents: {},

    originalRequest: {
      requestCode: 'QR-PA-SMIT-20230620-3456',
      submittedAt: getTimestamp(-7),
      flexibleDates: true,
    },

    acceptedQuote: {
      offerId: 'quote4',
      submittedAt: getTimestamp(-6),
    },

    checklistsCompleted: {
      operatorChecklist: true,
      clientChecklist: true,
      documentChecklist: true,
      paymentChecklist: true,
    },
  },
  {
    id: 'booking5',
    bookingId: 'BK-OPPRE-20230525-QRST',
    requestId: 'req5',
    quoteId: 'quote5',
    status: 'cancelled' as BookingStatus,
    createdAt: getTimestamp(-20),
    updatedAt: getTimestamp(-12),

    routing: {
      departureAirport: 'FACT', // Cape Town
      arrivalAirport: 'FAWB', // Windhoek
      departureDate: getTimestamp(-10),
      flexibleDates: false,
    },

    flightDetails: {
      flightNumber: 'CH7890',
    },

    clientId: 'PA-SMIT-ABCD',

    operator: {
      operatorUserCode: 'OP-SKYS-QRST',
      operatorName: 'Sky Services',
    },

    aircraft: {
      id: 'aircraft5',
      registration: 'ZS-SKY',
      make: 'Boeing',
      model: 'BBJ',
      maxPassengers: 19,
      category: 'VIP Airliner',
    },

    clientPreferences: {
      preferredCabinClass: 'vip' as CabinClass,
    },

    cabinClass: 'vip' as CabinClass,
    passengerCount: 8,
    passengers: [],

    payment: {
      subtotal: 45000,
      commission: 1350,
      totalAmount: 46350,
      amountPaid: 0,
      amountPending: 0, // Cancelled, no payment required
      currency: 'USD',
    },

    documents: {},

    originalRequest: {
      requestCode: 'QR-PA-SMIT-20230525-7890',
      submittedAt: getTimestamp(-22),
      flexibleDates: false,
    },

    acceptedQuote: {
      offerId: 'quote5',
      submittedAt: getTimestamp(-21),
    },

    checklistsCompleted: {
      operatorChecklist: false,
      clientChecklist: false,
      documentChecklist: false,
      paymentChecklist: false,
    },
  },
];

// API simulation functions
export const mockGetClientBookings = (clientId: string): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredBookings = mockBookings.filter((booking) => booking.clientId === clientId);
      resolve(filteredBookings);
    }, 800); // Simulate network delay
  });
};

export const mockGetOperatorBookings = (operatorUserCode: string): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredBookings = mockBookings.filter(
        (booking) => booking.operator.operatorUserCode === operatorUserCode
      );
      resolve(filteredBookings);
    }, 800); // Simulate network delay
  });
};

export const mockGetBookingById = (bookingId: string): Promise<Booking | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const booking = mockBookings.find((b) => b.id === bookingId);
      resolve(booking || null);
    }, 800); // Simulate network delay
  });
};
