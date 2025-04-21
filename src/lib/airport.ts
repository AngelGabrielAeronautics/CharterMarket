import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { Airport, AirportSearchResult } from '@/types/airport';

export const searchAirports = async (searchTerm: string): Promise<AirportSearchResult[]> => {
  try {
    const airportsRef = collection(db, 'airports');
    const searchTermUpper = searchTerm.toUpperCase();
    
    // Search by ICAO, IATA, name, or city
    const queries = [
      // ICAO code search
      query(
        airportsRef,
        orderBy('icao'),
        startAt(searchTermUpper),
        endAt(searchTermUpper + '\uf8ff'),
        limit(5)
      ),
      // IATA code search
      query(
        airportsRef,
        orderBy('iata'),
        startAt(searchTermUpper),
        endAt(searchTermUpper + '\uf8ff'),
        limit(5)
      ),
      // Name search
      query(
        airportsRef,
        orderBy('name'),
        startAt(searchTermUpper),
        endAt(searchTermUpper + '\uf8ff'),
        limit(5)
      ),
      // City search
      query(
        airportsRef,
        orderBy('city'),
        startAt(searchTermUpper),
        endAt(searchTermUpper + '\uf8ff'),
        limit(5)
      ),
    ];

    const results = await Promise.all(
      queries.map(q => getDocs(q))
    );

    // Combine and deduplicate results
    const airports = new Map<string, Airport>();
    results.forEach(querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        const airport = doc.data() as Airport;
        airports.set(airport.icao, airport);
      });
    });

    return Array.from(airports.values()).map(airport => ({
      icao: airport.icao,
      label: `${airport.icao} - ${airport.name} (${airport.city})`,
      airport,
    }));
  } catch (error) {
    console.error('Error searching airports:', error);
    throw new Error('Failed to search airports');
  }
};

export const validateICAO = async (icao: string): Promise<boolean> => {
  try {
    const airportsRef = collection(db, 'airports');
    const q = query(airportsRef, where('icao', '==', icao.toUpperCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error validating ICAO code:', error);
    throw new Error('Failed to validate ICAO code');
  }
};

export const getAirportByICAO = async (icao: string): Promise<Airport | null> => {
  try {
    const airportsRef = collection(db, 'airports');
    const q = query(airportsRef, where('icao', '==', icao.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as Airport;
  } catch (error) {
    console.error('Error getting airport:', error);
    throw new Error('Failed to get airport');
  }
}; 