import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { Operator, OperatorSearchResult } from '@/types/operator';
import { Airport } from '@/types/airport';
import { getAirportByICAO } from '@/lib/airport';

export const findAvailableOperators = async (
  departureAirport: string,
  arrivalAirport: string,
  passengerCount: number
): Promise<OperatorSearchResult[]> => {
  try {
    // Get airport details to determine regions
    const [depAirport, arrAirport] = await Promise.all([
      getAirportByICAO(departureAirport),
      getAirportByICAO(arrivalAirport),
    ]);

    if (!depAirport || !arrAirport) {
      throw new Error('Invalid airports');
    }

    // Query operators that:
    // 1. Are active
    // 2. Operate in the departure or arrival region
    // 3. Have aircraft that can accommodate the passenger count
    const operatorsRef = collection(db, 'operators');
    const q = query(
      operatorsRef,
      where('status', '==', 'active'),
      where('operatingRegions', 'array-contains-any', [
        depAirport.country,
        arrAirport.country,
      ])
    );

    const querySnapshot = await getDocs(q);
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
    return querySnapshot.docs.map(doc => {
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