'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { UserRole } from '@/lib/userCode';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import PhoneInput from '@/components/ui/PhoneInput';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingPassenger, setIsAddingPassenger] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // First, get the user's details to create default passenger
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        
        // Then get all passengers
        const passengersRef = collection(db, 'users', userData.userCode, 'passengers');
        const passengersSnapshot = await getDocs(passengersRef);
        
        const passengersData = passengersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Passenger[];

        // If no passengers exist, create default passenger from user data
        if (passengersData.length === 0) {
          const defaultPassenger = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || '',
            dateOfBirth: '',
            passportNumber: '',
            passportExpiry: '',
            nationality: '',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const docRef = await addDoc(collection(db, 'users', userData.userCode, 'passengers'), defaultPassenger);
          passengersData.push({ id: docRef.id, ...defaultPassenger });
        }

        setPassengers(passengersData);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const passengersRef = collection(db, 'users', userData.userCode, 'passengers');
        
        const newPassenger = {
          ...formData,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await addDoc(passengersRef, newPassenger);
        
        setPassengers(prev => [...prev, { id: docRef.id, ...newPassenger }]);
        setIsAddingPassenger(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          passportNumber: '',
          passportExpiry: '',
          nationality: '',
        });
        setSuccess('Passenger added successfully');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async (passengerId: string) => {
    if (!confirm('Are you sure you want to delete this passenger?')) return;
    
    setError('');
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        await deleteDoc(doc(db, 'users', userData.userCode, 'passengers', passengerId));
        setPassengers(prev => prev.filter(p => p.id !== passengerId));
        setSuccess('Passenger deleted successfully');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 dark:text-cream-100">Passengers</h1>
        <p className="mt-2 text-sm text-primary-600 dark:text-cream-200">
          Manage your passenger list for bookings
        </p>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-md mb-6 ${
          error 
            ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
        }`}>
          {error || success}
        </div>
      )}

      <div className="bg-white dark:bg-dark-secondary shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary-900 dark:text-cream-100">Passenger List</h2>
          <button
            onClick={() => setIsAddingPassenger(!isAddingPassenger)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isAddingPassenger ? 'CANCEL' : 'ADD PASSENGER'}
          </button>
        </div>

        {isAddingPassenger ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                helperText="Passenger's legal first name"
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                helperText="Passenger's legal last name"
                autoComplete="family-name"
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                helperText="Passenger's contact email"
                autoComplete="email"
              />
              <PhoneInput
                value={formData.phoneNumber}
                onChange={(value) => handleChange({ target: { name: 'phoneNumber', value } } as any)}
                required
                helperText="Passenger's contact phone number"
              />
              <DateInput
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                helperText="Passenger's date of birth"
                max={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                required
                helperText="Passenger's nationality"
              />
              <Input
                label="Passport Number"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                required
                helperText="Passenger's passport number"
              />
              <DateInput
                label="Passport Expiry"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleChange}
                required
                helperText="Passport expiry date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setIsAddingPassenger(false)}
                className="px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-primary-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'SAVING...' : 'SAVE PASSENGER'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {passengers.map((passenger) => (
              <div
                key={passenger.id}
                className="border dark:border-dark-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors duration-150"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-primary-900 dark:text-cream-100">
                      {passenger.firstName} {passenger.lastName}
                      {passenger.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                          Default
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-primary-600 dark:text-cream-200">
                      <p><span className="font-medium">Email:</span> {passenger.email}</p>
                      <p><span className="font-medium">Phone:</span> {passenger.phoneNumber}</p>
                      <p><span className="font-medium">Date of Birth:</span> {passenger.dateOfBirth}</p>
                      <p><span className="font-medium">Nationality:</span> {passenger.nationality}</p>
                      <p><span className="font-medium">Passport:</span> {passenger.passportNumber}</p>
                      <p><span className="font-medium">Passport Expiry:</span> {passenger.passportExpiry}</p>
                    </div>
                  </div>
                  {!passenger.isDefault && (
                    <button
                      onClick={() => handleDelete(passenger.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 