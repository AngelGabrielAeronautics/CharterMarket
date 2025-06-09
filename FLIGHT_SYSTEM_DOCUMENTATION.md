# Charter Flight System Documentation

## Overview

The Charter platform implements a comprehensive flight management system that handles the complete journey from quote requests to flight execution, including support for flight legs and empty leg monetization.

## System Flow

The system follows this logical progression:

### Step 1: Quote Request
- **Entity**: `QuoteRequest`
- **Description**: Client submits a flight request
- **ID Format**: `QR-{userCode}-{YYYYMMDD}-{XXXX}`
- **Example**: `QR-CLIENT-20241201-A1B2`

### Step 2: Quote (Offer)
- **Entity**: `Offer`
- **Description**: Operator submits a quote/offer in response to the request
- **ID Format**: `QT-{operatorCode}-{YYYYMMDD}-{XXXX}`
- **Example**: `QT-OP-JETS-20241201-A1B2`
- **Commission**: 3% added to operator's base price

### Step 3: Booking
- **Entity**: `Booking`
- **Description**: Created when client accepts an offer and completes payment
- **ID Format**: `BK-{operatorCode}-{YYYYMMDD}-{XXXX}`
- **Example**: `BK-OP-JETS-20241201-C3D4`
- **Status**: Tracks payment and manifest completion

### Step 4: Flight
- **Entity**: `Flight`
- **Description**: The apex stage combining one or more bookings
- **ID Format**: `FLT-{operatorCode}-{6 random alphanumeric}-{leg number}`
- **Example**: `FLT-OP-JETS-WS1LW12L0A-1`

## Flight Numbering System

### Flight Group ID
- **Format**: `FLT-{operatorUserCode}-{6 random alphanumeric}`
- **Example**: `FLT-OP-JETS-WS1LW12L0A`
- **Purpose**: Groups all legs of the same flight operation

### Flight Number (with Leg)
- **Format**: `FLT-{operatorUserCode}-{6 random alphanumeric}-{leg number}`
- **Examples**: 
  - `FLT-OP-JETS-WS1LW12L0A-1` (Passenger leg)
  - `FLT-OP-JETS-WS1LW12L0A-2` (Empty leg)

### Example Scenario
```
Customer books JFK → LAX:
├── FLT-OP-JETS-WS1LW12L0A-1 (JFK → LAX) - Passenger leg
└── FLT-OP-JETS-WS1LW12L0A-2 (LAX → JFK) - Empty leg (available for booking)
```

## Flight Legs System

### Leg Types
1. **Passenger Leg**: Booked leg with paying passengers
2. **Empty Leg**: Return or positioning leg available for booking

### Leg Statuses
- `scheduled`: Planned but not yet active
- `available`: Empty leg available for booking
- `booked`: Has passenger bookings
- `in-progress`: Currently flying
- `completed`: Leg finished
- `cancelled`: Leg cancelled

### Empty Leg Benefits
- **For Operators**: Monetize return flights
- **For Customers**: Discounted flights on available routes
- **For Platform**: Increased utilization and revenue

## Data Model Structure

### Flight
```typescript
interface Flight {
  id: string;                    // Firestore document ID
  flightGroupId: string;         // Base flight ID without leg suffix
  operatorUserCode: string;      // Operator identifier
  aircraftId: string;            // Aircraft being used
  legs: FlightLeg[];             // All legs in this flight
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  totalLegs: number;             // Number of legs
  primaryBookingId?: string;     // Booking that initiated the flight
  originalQuoteRequestId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### FlightLeg
```typescript
interface FlightLeg {
  legNumber: number;                    // 1, 2, 3, etc.
  flightNumber: string;                 // Full flight number with leg
  legType: 'passenger' | 'empty';       // Type of leg
  status: FlightLegStatus;              // Current status
  departureAirport: string;             // ICAO code
  arrivalAirport: string;               // ICAO code
  scheduledDepartureTime: Timestamp;
  scheduledArrivalTime: Timestamp;
  actualDepartureTime?: Timestamp;
  actualArrivalTime?: Timestamp;
  bookingIds?: string[];                // Bookings on this leg
  availableSeats?: number;              // Seats still available
  maxSeats: number;                     // Total aircraft capacity
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Implementation

### Key Services

#### FlightService
Main service for flight management:
- `createFlightFromBooking()`: Creates flight with legs from a booking
- `addBookingToFlightLeg()`: Adds booking to existing leg
- `findAvailableEmptyLegs()`: Searches for available empty legs
- `updateFlightStatus()`: Updates overall flight status
- `updateLegStatus()`: Updates specific leg status

#### Serial Generation
Flight numbering utilities:
- `generateFlightGroupId()`: Creates base flight identifier
- `generateFlightNumber()`: Creates complete flight number with leg
- `parseFlightNumber()`: Extracts components from flight number

### Usage Examples

#### Creating a Flight
```typescript
const flightData: CreateFlightData = {
  operatorUserCode: 'OP-JETS',
  aircraftId: 'AC-OP-JETS-G650',
  primaryBookingId: 'BK-OP-JETS-20241201-C3D4',
  originalQuoteRequestId: 'QR-CLIENT-20241201-A1B2',
  primaryLeg: {
    departureAirport: 'KJFK',
    arrivalAirport: 'KLAX',
    scheduledDepartureTime: departureTime,
    scheduledArrivalTime: arrivalTime,
    maxSeats: 14,
    bookingIds: ['BK-OP-JETS-20241201-C3D4']
  },
  returnLeg: {
    departureAirport: 'KLAX',
    arrivalAirport: 'KJFK',
    scheduledDepartureTime: returnTime,
    scheduledArrivalTime: returnArrivalTime,
    maxSeats: 14
  }
};

const flight = await FlightService.createFlightFromBooking(booking, flightData);
```

#### Finding Empty Legs
```typescript
const emptyLegs = await FlightService.findAvailableEmptyLegs(
  'KLAX',  // departure
  'KJFK',  // arrival  
  startDate,
  endDate
);
```

#### Booking an Empty Leg
```typescript
await FlightService.addBookingToFlightLeg(
  flightId,
  2,  // leg number
  bookingId
);
```

## System Benefits

### For Operators
- ✅ Access to large client base
- ✅ No marketing costs
- ✅ Monetize empty legs
- ✅ Maximize aircraft utilization
- ✅ Transparent pricing with commission

### For Clients
- ✅ Multiple quotes from single request
- ✅ Access to empty legs at discounted rates
- ✅ Shared flight cost optimization
- ✅ Comprehensive flight management
- ✅ Clear pricing breakdown

### For Platform
- ✅ 3% commission on all bookings
- ✅ Increased inventory through empty legs
- ✅ Higher aircraft utilization
- ✅ Scalable flight management
- ✅ Clear audit trail

## Operational Scenarios

### Scenario 1: Single Passenger Booking
1. Client requests JFK → LAX
2. Operator quotes $45,000 + $1,350 commission = $46,350
3. Client accepts and pays
4. Flight created: `FLT-OP-JETS-ABC123-1` (passenger leg)
5. Empty leg created: `FLT-OP-JETS-ABC123-2` (available for booking)

### Scenario 2: Empty Leg Booking
1. Flight `FLT-OP-JETS-ABC123-2` (LAX → JFK) is available
2. New client searches LAX → JFK
3. System finds empty leg
4. Client books at discounted rate
5. Empty leg becomes passenger leg

### Scenario 3: Shared Flight
1. Flight `FLT-OP-JETS-ABC123-1` has 8 available seats
2. Second client books same route
3. Both bookings added to same leg
4. Cost shared between passengers
5. Operator maximizes revenue per flight

## Implementation Files

### Core Type Definitions
- `src/types/flight.ts`: Flight, FlightLeg, and related interfaces
- `src/types/booking.ts`: Booking interface with flight integration

### Services
- `src/lib/flight-service.ts`: Main flight management service
- `src/lib/serials.ts`: ID generation utilities

### Utilities
- `src/utils/flight-demo.ts`: Demo and testing utilities

## Testing

The system has been validated with:
- Flight number generation and parsing
- Leg creation and management
- Empty leg discovery
- Booking integration
- Status progression

## Conclusion

This flight system provides a comprehensive solution for managing the complete lifecycle from quote requests to flight completion, with built-in support for empty leg monetization and shared flights, maximizing value for all parties in the Charter ecosystem. 