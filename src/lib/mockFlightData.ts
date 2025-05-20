import { addDays, subDays, addHours, format } from 'date-fns';
import { CalendarFlight } from '@/components/calendar/FlightCalendar';
import { UserRole } from '@/lib/userCode';

// Airport codes to use in mock data
const airports = [
  { code: 'FAJS', name: 'Johannesburg' },
  { code: 'FACT', name: 'Cape Town' },
  { code: 'FADN', name: 'Durban' },
  { code: 'FAPE', name: 'Port Elizabeth' },
  { code: 'FBSK', name: 'Gaborone' },
  { code: 'FVFA', name: 'Victoria Falls' },
  { code: 'FYWH', name: 'Windhoek' },
  { code: 'FMMI', name: 'Mauritius' },
  { code: 'FIMP', name: 'Plaisance' },
  { code: 'FZAA', name: 'Kinshasa' },
];

// Generate a random airport code, excluding one if provided
const getRandomAirport = (exclude?: string): string => {
  let airport;
  do {
    airport = airports[Math.floor(Math.random() * airports.length)].code;
  } while (airport === exclude);
  return airport;
};

// Operators for mock data
const operators = [
  { code: 'OP-JETS-ABCD', name: 'Luxury Jets' },
  { code: 'OP-AIRS-EFGH', name: 'AirStar Executive' },
  { code: 'OP-ELIT-IJKL', name: 'Elite Air' },
  { code: 'OP-SKYH-MNOP', name: 'Sky High Jets' },
  { code: 'OP-PREM-QRST', name: 'Premium Aviation' },
];

// Clients for mock data
const clients = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'ABC Travels',
  'Corporate Aviation',
  'Executive Services',
  'Global Enterprises',
  'Luxury Travels',
];

// Generate a flight code
const generateFlightCode = (operatorCode: string, date: Date): string => {
  return `FLT-${operatorCode.split('-')[1]}-${format(date, 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Generate mock flights for a given user role
export const generateMockFlights = (
  userRole: UserRole,
  days: number = 30,
  baseCount: number = 15
): CalendarFlight[] => {
  const today = new Date();
  const flights: CalendarFlight[] = [];
  const count = baseCount + Math.floor(Math.random() * 10); // Random number between baseCount and baseCount+10

  // Generate random dates within the range
  for (let i = 0; i < count; i++) {
    // Random date between -days/2 and +days days from today
    const randomDayOffset = Math.floor(Math.random() * days) - Math.floor(days / 4);
    const date = addDays(today, randomDayOffset);

    // Generate from/to airports
    const from = getRandomAirport();
    const to = getRandomAirport(from);

    // Select a random operator
    const operator = operators[Math.floor(Math.random() * operators.length)];

    // Select a random client
    const client = clients[Math.floor(Math.random() * clients.length)];

    // Generate a flight code
    const flightCode = generateFlightCode(operator.code, date);

    // Determine flight status - bias towards confirmed
    const statusRandom = Math.random();
    let status: 'confirmed' | 'pending' | 'cancelled';
    if (statusRandom < 0.7) {
      status = 'confirmed';
    } else if (statusRandom < 0.9) {
      status = 'pending';
    } else {
      status = 'cancelled';
    }

    // Generate passengers count
    const passengers = Math.floor(2 + Math.random() * 14); // 2-16 passengers

    // Create flight object
    const flight: CalendarFlight = {
      id: `flight-${i}`,
      flightCode,
      from,
      to,
      date,
      status,
      passengers,
      operatorCode: operator.code,
      operatorName: operator.name,
      clientName: client,
      // For passengers and agents, flights are either departures or arrivals
      // For operators, flights are both
      role: userRole === 'operator' ? 'both' : Math.random() > 0.5 ? 'departure' : 'arrival',
    };

    flights.push(flight);

    // For some flights, add a return flight
    if (Math.random() > 0.7) {
      const returnDays = Math.floor(1 + Math.random() * 4); // Return in 1-5 days
      const returnDate = addDays(date, returnDays);
      const returnFlightCode = generateFlightCode(operator.code, returnDate);

      const returnFlight: CalendarFlight = {
        id: `flight-${i}-return`,
        flightCode: returnFlightCode,
        from: to, // Swap from/to
        to: from,
        date: returnDate,
        status,
        passengers,
        operatorCode: operator.code,
        operatorName: operator.name,
        clientName: client,
        role: userRole === 'operator' ? 'both' : Math.random() > 0.5 ? 'departure' : 'arrival',
      };

      flights.push(returnFlight);
    }
  }

  return flights;
};
