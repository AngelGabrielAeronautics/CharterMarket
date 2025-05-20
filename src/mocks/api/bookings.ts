import { Timestamp } from 'firebase/firestore';
import { Booking } from '@/types/booking';
import { CabinClass } from '@/types/flight';

// Create mock timestamps for dates
const getTimestamp = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return Timestamp.fromDate(date);
};

// Sample bookings data for testing
export const mockBookings: Booking[] = [
  {
    id: 'booking1',
    bookingId: 'FLT-OP-JETS-20230601-1234',
    requestId: 'req1',
    requestCode: 'RQ-PA-SMIT-20230601-1234',
    quoteId: 'quote1',
    operatorId: 'OP-JETS-ABCD',
    clientId: 'PA-SMIT-ABCD',
    routing: {
      departureAirport: 'FAJS', // Johannesburg
      arrivalAirport: 'FACT', // Cape Town
      departureDate: getTimestamp(7),
      flexibleDates: false,
    },
    passengerCount: 4,
    cabinClass: 'premium' as CabinClass,
    price: 25000,
    totalPrice: 25750,
    status: 'confirmed',
    createdAt: getTimestamp(-3),
    updatedAt: getTimestamp(-1),
    flightNumber: 'CH1234',
    operatorName: 'Luxury Jets',
    isPaid: true,
  },
  {
    id: 'booking2',
    bookingId: 'FLT-OP-AFRI-20230610-5678',
    requestId: 'req2',
    requestCode: 'RQ-PA-SMIT-20230610-5678',
    quoteId: 'quote2',
    operatorId: 'OP-AFRI-EFGH',
    clientId: 'PA-SMIT-ABCD',
    routing: {
      departureAirport: 'FACT', // Cape Town
      arrivalAirport: 'FALE', // Durban
      departureDate: getTimestamp(14),
      flexibleDates: true,
    },
    passengerCount: 2,
    cabinClass: 'standard' as CabinClass,
    price: 15000,
    totalPrice: 15450,
    status: 'pending',
    createdAt: getTimestamp(-1),
    updatedAt: getTimestamp(-1),
    flightNumber: 'CH5678',
    operatorName: 'African Wings',
    isPaid: false,
  },
  {
    id: 'booking3',
    bookingId: 'FLT-OP-EXEC-20230515-9012',
    requestId: 'req3',
    requestCode: 'RQ-PA-SMIT-20230515-9012',
    quoteId: 'quote3',
    operatorId: 'OP-EXEC-IJKL',
    clientId: 'PA-SMIT-ABCD',
    routing: {
      departureAirport: 'FAJS', // Johannesburg
      arrivalAirport: 'FBSK', // Gaborone
      departureDate: getTimestamp(-7),
      flexibleDates: false,
    },
    passengerCount: 6,
    cabinClass: 'vip' as CabinClass,
    price: 35000,
    totalPrice: 36050,
    status: 'completed',
    createdAt: getTimestamp(-14),
    updatedAt: getTimestamp(-6),
    flightNumber: 'CH9012',
    operatorName: 'Executive Air',
    isPaid: true,
  },
  {
    id: 'booking4',
    bookingId: 'FLT-OP-PREM-20230620-3456',
    requestId: 'req4',
    requestCode: 'RQ-PA-SMIT-20230620-3456',
    quoteId: 'quote4',
    operatorId: 'OP-PREM-MNOP',
    clientId: 'PA-SMIT-ABCD',
    routing: {
      departureAirport: 'FALE', // Durban
      arrivalAirport: 'FAJS', // Johannesburg
      departureDate: getTimestamp(21),
      flexibleDates: true,
    },
    passengerCount: 3,
    cabinClass: 'premium' as CabinClass,
    price: 18000,
    totalPrice: 18540,
    status: 'confirmed',
    createdAt: getTimestamp(-5),
    updatedAt: getTimestamp(-3),
    flightNumber: 'CH3456',
    operatorName: 'Premium Jets',
    isPaid: true,
  },
  {
    id: 'booking5',
    bookingId: 'FLT-OP-SKYS-20230525-7890',
    requestId: 'req5',
    requestCode: 'RQ-PA-SMIT-20230525-7890',
    quoteId: 'quote5',
    operatorId: 'OP-SKYS-QRST',
    clientId: 'PA-SMIT-ABCD',
    routing: {
      departureAirport: 'FACT', // Cape Town
      arrivalAirport: 'FAWB', // Windhoek
      departureDate: getTimestamp(-10),
      flexibleDates: false,
    },
    passengerCount: 8,
    cabinClass: 'vip' as CabinClass,
    price: 45000,
    totalPrice: 46350,
    status: 'cancelled',
    createdAt: getTimestamp(-20),
    updatedAt: getTimestamp(-12),
    flightNumber: 'CH7890',
    operatorName: 'Sky Services',
    isPaid: false,
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

export const mockGetOperatorBookings = (operatorId: string): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredBookings = mockBookings.filter((booking) => booking.operatorId === operatorId);
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
