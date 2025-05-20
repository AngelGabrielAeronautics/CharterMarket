import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Operator, OperatorSearchResult } from '@/types/operator';
import { getAirportByICAO } from '@/lib/airport';

export const findAvailableOperators = async (
  departureAirport: string,
  arrivalAirport: string,
  passengerCount: number
): Promise<OperatorSearchResult[]> => {
  try {
    console.log(
      `Finding operators for route ${departureAirport} to ${arrivalAirport} with ${passengerCount} passengers`
    );

    // Get airport details to determine regions
    const [depAirport, arrAirport] = await Promise.all([
      getAirportByICAO(departureAirport),
      getAirportByICAO(arrivalAirport),
    ]);

    if (!depAirport || !arrAirport) {
      console.error(`Invalid airports: ${departureAirport} or ${arrivalAirport} not found`);
      throw new Error('Invalid airports');
    }

    console.log(
      `Departure airport region: ${depAirport.country}, Arrival airport region: ${arrAirport.country}`
    );

    // Query operators that:
    // 1. Are active
    // 2. Operate in the departure or arrival region
    const operatorsRef = collection(db, 'operators');
    const q = query(
      operatorsRef,
      where('status', '==', 'active'),
      where('operatingRegions', 'array-contains-any', [depAirport.country, arrAirport.country])
    );

    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} operators matching region criteria`);

    const operators: OperatorSearchResult[] = [];

    for (const doc of querySnapshot.docs) {
      const operator = doc.data() as Operator;

      // Check if operator has suitable aircraft
      const aircraftRef = collection(db, 'aircraft');
      const aircraftQuery = query(
        aircraftRef,
        where('operatorId', '==', doc.id),
        where('maxPassengers', '>=', passengerCount),
        where('status', '==', 'active')
      );

      const aircraftSnapshot = await getDocs(aircraftQuery);

      if (!aircraftSnapshot.empty) {
        operators.push({
          id: doc.id,
          operatorCode: operator.operatorCode,
          companyName: operator.companyName,
          baseAirport: operator.baseAirport,
          fleetSize: operator.fleetSize,
          status: operator.status,
        });
        console.log(`Added operator: ${operator.companyName} (${operator.operatorCode})`);
      }
    }

    // If no operators found, try a fallback approach - get any active operator
    if (operators.length === 0) {
      console.log('No matching operators found with suitable aircraft. Using fallback.');

      const fallbackQuery = query(operatorsRef, where('status', '==', 'active'));

      const fallbackSnapshot = await getDocs(fallbackQuery);

      if (!fallbackSnapshot.empty) {
        // Take the first active operator as fallback
        const fallbackDoc = fallbackSnapshot.docs[0];
        const fallbackOperator = fallbackDoc.data() as Operator;

        operators.push({
          id: fallbackDoc.id,
          operatorCode: fallbackOperator.operatorCode,
          companyName: fallbackOperator.companyName,
          baseAirport: fallbackOperator.baseAirport,
          fleetSize: fallbackOperator.fleetSize,
          status: fallbackOperator.status,
        });

        console.log(
          `Using fallback operator: ${fallbackOperator.companyName} (${fallbackOperator.operatorCode})`
        );
      } else {
        console.error('No active operators found in the system at all');
      }
    }

    return operators;
  } catch (error) {
    console.error('Error finding available operators:', error);
    throw new Error('Failed to find available operators');
  }
};

export const getOperator = async (id: string): Promise<Operator | null> => {
  try {
    const operatorRef = doc(db, 'operators', id);
    const operatorDoc = await getDoc(operatorRef);

    if (!operatorDoc.exists()) {
      return null;
    }

    return {
      id: operatorDoc.id,
      ...operatorDoc.data(),
    } as Operator;
  } catch (error) {
    console.error('Error getting operator:', error);
    throw new Error('Failed to get operator');
  }
};

export const getOperatorsByRegion = async (region: string): Promise<OperatorSearchResult[]> => {
  try {
    const operatorsRef = collection(db, 'operators');
    const q = query(
      operatorsRef,
      where('status', '==', 'active'),
      where('operatingRegions', 'array-contains', region)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const operator = doc.data() as Operator;
      return {
        id: doc.id,
        operatorCode: operator.operatorCode,
        companyName: operator.companyName,
        baseAirport: operator.baseAirport,
        fleetSize: operator.fleetSize,
        status: operator.status,
      };
    });
  } catch (error) {
    console.error('Error getting operators by region:', error);
    throw new Error('Failed to get operators by region');
  }
};
