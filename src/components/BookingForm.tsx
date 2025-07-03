'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Box,
  Button,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import LuggageIcon from '@mui/icons-material/Luggage';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { addMonths, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import toast from 'react-hot-toast';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import AirportSelect from '@/components/ui/AirportSelect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDateTimePicker from '@/components/ui/custom-date-time-picker';
import { createQuoteRequest, submitQuoteRequest } from '@/lib/flight';

// Types
type FlightType = 'one-way' | 'return' | 'multicity';

interface FlightLeg {
  from: string;
  to: string;
  departureDate: Date | null; // Combined date & time (null until both selected)
  departureDatePart: Date | null; // Date only
  departureTimePart: Date | null; // Time only
  passengers: number; // <-- Add passengers to FlightLeg
}

interface FormState {
  flightType: FlightType;
  legs: FlightLeg[];
  returnDate: Date | null;
  returnDatePart: Date | null;
  returnTimePart: Date | null;
  passengers: number; // This will be for one-way/return, and default for first multi-city leg
  flexibleDates: boolean;
  flexibleTimes: boolean;
  twinEngineMin: boolean;
  pressurisedCabin: boolean;
  twoCrewMin: boolean;
  hasPets: boolean;
  petDetails: string;
  hasExtraBaggage: boolean;
  baggageDetails: string;
  hasHardBags: boolean;
  hardBagsDetails: string;
  hasSpecialEquipment: boolean;
  equipmentDetails: string;
  additionalNotes: string;
}

// Add default form state for resets
const initialFormState: FormState = {
  flightType: 'one-way',
  legs: [
    {
      from: '',
      to: '',
      departureDate: null,
      departureDatePart: null,
      departureTimePart: null,
      passengers: 0,
    },
  ], // Default to 0
  returnDate: null,
  returnDatePart: null,
  returnTimePart: null,
  passengers: 0, // Default global passengers to 0
  flexibleDates: false,
  flexibleTimes: false,
  twinEngineMin: false,
  pressurisedCabin: false,
  twoCrewMin: false,
  hasPets: false,
  petDetails: '',
  hasExtraBaggage: false,
  baggageDetails: '',
  hasHardBags: false,
  hardBagsDetails: '',
  hasSpecialEquipment: false,
  equipmentDetails: '',
  additionalNotes: '',
};

// Unique ID for duplicate airport error toast
const DUPLICATE_AIRPORT_ERROR_ID = 'duplicate-airport-error';
const INVALID_DATE_RANGE_ERROR_ID = 'invalid-date-range-error';
const MULTI_CITY_DATE_SEQUENCE_ERROR_ID = 'multi-city-date-sequence-error';
const RETURN_MAX_RANGE_ERROR_ID = 'return-max-range-error';
const MULTI_CITY_MAX_LEG_RANGE_ERROR_ID = 'multi-city-max-leg-range-error';

// Add constant key and util functions near the top, after initial imports and before types
const PENDING_DRAFT_KEY = 'pending_quote_request_draft';

const saveDraftToLocalStorage = (draft: FormState) => {
  localStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(draft));
};

const getDraftFromLocalStorage = (): FormState | null => {
  const draft = localStorage.getItem(PENDING_DRAFT_KEY);
  return draft ? JSON.parse(draft) : null;
};

const clearDraftFromLocalStorage = () => {
  localStorage.removeItem(PENDING_DRAFT_KEY);
};

const reviveDraft = (raw: any): FormState => {
  const parseDate = (d: any) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d === 'string' || typeof d === 'number') {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof d === 'object' && 'seconds' in d) {
      return new Date((d.seconds as number) * 1000);
    }
    return null;
  };

  const revived: FormState = {
    ...raw,
    returnDate: parseDate(raw.returnDate),
    returnDatePart: parseDate(raw.returnDatePart),
    returnTimePart: parseDate(raw.returnTimePart),
    legs: raw.legs.map((leg: any) => ({
      ...leg,
      departureDate: parseDate(leg.departureDate),
      departureDatePart: parseDate(leg.departureDatePart),
      departureTimePart: parseDate(leg.departureTimePart),
    })),
  };
  return revived;
};

export default function BookingForm() {
  const theme = useTheme();
  const { user, userRole } = useAuth();
  const { openLoginModal, openRegisterModal } = useModal();
  const router = useRouter();

  // Form state
  const [formState, setFormState] = useState<FormState>(initialFormState);

  // UI state
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);

  // Effect to manage date range error toast
  useEffect(() => {
    const departureDate = formState.legs[0]?.departureDate;
    const returnDate = formState.returnDate;
    let activeToastId: string | null = null;

    // Clear all potential date error toasts initially
    toast.dismiss(INVALID_DATE_RANGE_ERROR_ID);
    toast.dismiss(MULTI_CITY_DATE_SEQUENCE_ERROR_ID);
    toast.dismiss(RETURN_MAX_RANGE_ERROR_ID);
    toast.dismiss(MULTI_CITY_MAX_LEG_RANGE_ERROR_ID);

    if (formState.flightType === 'return' && departureDate && returnDate) {
      if (departureDate > returnDate) {
        toast.error('Departure date cannot be after return date', {
          id: INVALID_DATE_RANGE_ERROR_ID,
          duration: Infinity,
        });
        activeToastId = INVALID_DATE_RANGE_ERROR_ID;
      } else {
        const maxAllowedReturnDate = addDays(departureDate, 30);
        if (returnDate > maxAllowedReturnDate) {
          toast.error('Return date must be within 30 days of departure.', {
            id: RETURN_MAX_RANGE_ERROR_ID,
            duration: Infinity,
          });
          activeToastId = RETURN_MAX_RANGE_ERROR_ID;
        }
      }
    } else if (formState.flightType === 'multicity' && formState.legs.length > 1) {
      for (let i = 1; i < formState.legs.length; i++) {
        const prevLegDate = formState.legs[i - 1]?.departureDate;
        const currentLegDate = formState.legs[i]?.departureDate;
        if (prevLegDate && currentLegDate) {
          if (currentLegDate < prevLegDate) {
            toast.error('Flight dates [and times] must follow in a sequential order.', {
              id: MULTI_CITY_DATE_SEQUENCE_ERROR_ID,
              duration: Infinity,
            });
            activeToastId = MULTI_CITY_DATE_SEQUENCE_ERROR_ID;
            break;
          }
          const maxAllowedNextLegDate = addDays(prevLegDate, 10);
          if (currentLegDate > maxAllowedNextLegDate) {
            toast.error('Each multi-city flight must be within 10 days of the previous one.', {
              id: MULTI_CITY_MAX_LEG_RANGE_ERROR_ID,
              duration: Infinity,
            });
            activeToastId = MULTI_CITY_MAX_LEG_RANGE_ERROR_ID;
            break;
          }
        }
      }
    }
    // Ensure only the active toast remains if one was set, otherwise all are dismissed by the initial clear
    [
      INVALID_DATE_RANGE_ERROR_ID,
      MULTI_CITY_DATE_SEQUENCE_ERROR_ID,
      RETURN_MAX_RANGE_ERROR_ID,
      MULTI_CITY_MAX_LEG_RANGE_ERROR_ID,
    ].forEach((id) => {
      if (id !== activeToastId) {
        toast.dismiss(id);
      }
    });
  }, [formState.legs, formState.returnDate, formState.flightType]);

  // Passenger count handlers
  const incrementPassengers = (legIndex?: number) => {
    setFormState((prev) => {
      if (prev.flightType === 'multicity' && typeof legIndex === 'number') {
        const currentLegPassengers = prev.legs[legIndex].passengers;
        const newLegPassengerCount =
          currentLegPassengers === 0 ? 1 : Math.min(300, currentLegPassengers + 1);
        const newLegs = prev.legs.map((leg, idx) =>
          idx === legIndex ? { ...leg, passengers: newLegPassengerCount } : leg
        );
        for (let i = legIndex + 1; i < newLegs.length; i++) {
          newLegs[i] = { ...newLegs[i], passengers: newLegPassengerCount };
        }
        return { ...prev, legs: newLegs };
      } else {
        const currentGlobalPassengers = prev.passengers;
        return {
          ...prev,
          passengers:
            currentGlobalPassengers === 0 ? 1 : Math.min(300, currentGlobalPassengers + 1),
        };
      }
    });
  };

  const decrementPassengers = (legIndex?: number) => {
    setFormState((prev) => {
      if (prev.flightType === 'multicity' && typeof legIndex === 'number') {
        const newLegs = prev.legs.map((leg, idx) =>
          idx === legIndex ? { ...leg, passengers: Math.max(1, leg.passengers - 1) } : leg
        );
        // Cascade change to subsequent legs
        for (let i = legIndex + 1; i < newLegs.length; i++) {
          newLegs[i] = { ...newLegs[i], passengers: newLegs[legIndex].passengers };
        }
        return { ...prev, legs: newLegs };
      } else {
        return { ...prev, passengers: Math.max(1, prev.passengers - 1) };
      }
    });
  };

  const updateLegPassengers = (legIndex: number, count: number) => {
    setFormState((prev) => {
      const newLegs = prev.legs.map((leg, idx) =>
        idx === legIndex ? { ...leg, passengers: count } : leg
      );
      // Cascade change to subsequent legs
      if (prev.flightType === 'multicity') {
        for (let i = legIndex + 1; i < newLegs.length; i++) {
          newLegs[i] = { ...newLegs[i], passengers: count };
        }
      }
      return { ...prev, legs: newLegs };
    });
  };

  // Flight leg handlers
  const addFlightLeg = () => {
    if (formState.legs.length >= 4) return;
    setFormState((prev) => {
      const newFrom =
        prev.flightType === 'multicity' && prev.legs.length > 0
          ? prev.legs[prev.legs.length - 1].to
          : '';
      const newPassengers =
        prev.flightType === 'multicity' && prev.legs.length > 0
          ? prev.legs[prev.legs.length - 1].passengers // Cascade previous leg's passengers (could be 0)
          : prev.passengers; // Default to global passengers (could be 0)
      return {
        ...prev,
        legs: [
          ...prev.legs,
          {
            from: newFrom,
            to: '',
            departureDate: null,
            departureDatePart: null,
            departureTimePart: null,
            passengers: newPassengers,
          },
        ],
      };
    });
  };

  const removeFlightLeg = (index: number) => {
    if (formState.legs.length <= 1) return;

    setFormState((prev) => {
      let newLegs = prev.legs.filter((_, i) => i !== index);
      // Multi-city cascading logic: if a leg is removed, update the 'from' of the now-current leg at this index
      if (prev.flightType === 'multicity' && newLegs.length > index && index > 0) {
        newLegs[index] = { ...newLegs[index], from: newLegs[index - 1].to };
      } else if (prev.flightType === 'multicity' && newLegs.length > 0 && index === 0) {
        // If first leg was removed and others remain, the new first leg's 'from' should be editable (not cascaded)
        // Or, if it was the first leg being removed and it became the new first, ensure it's not linked.
        newLegs[0] = { ...newLegs[0], from: '' }; // Or whatever default/initial value you prefer
      }
      return { ...prev, legs: newLegs };
    });
  };

  const updateLeg = (index: number, field: keyof FlightLeg, value: any) => {
    // Validate that departure and arrival airports are not the same
    const currentLeg = formState.legs[index];
    const newFrom = field === 'from' ? value : currentLeg.from;
    const newTo = field === 'to' ? value : currentLeg.to;
    if (newFrom && newTo && newFrom === newTo) {
      toast.error('Departure and arrival airports cannot be the same', {
        id: DUPLICATE_AIRPORT_ERROR_ID,
        duration: Infinity,
      });
      return;
    }
    // Dismiss the persistent duplicate error once corrected
    toast.dismiss(DUPLICATE_AIRPORT_ERROR_ID);
    // Update the leg normally
    setFormState((prev) => {
      let updatedLegs = prev.legs.map((leg, i) => {
        if (i !== index) return leg;
        const newLeg = { ...leg, [field]: value } as FlightLeg;
        // Recalculate combined date if date or time part changed
        if (field === 'departureDatePart' || field === 'departureTimePart') {
          if (newLeg.departureDatePart && newLeg.departureTimePart) {
            const combined = new Date(newLeg.departureDatePart);
            combined.setHours(
              newLeg.departureTimePart.getHours(),
              newLeg.departureTimePart.getMinutes(),
              0,
              0
            );
            newLeg.departureDate = combined;
          } else {
            newLeg.departureDate = null;
          }
        }
        return newLeg;
      });

      // Multi-city cascading logic: if 'to' changed, update next leg's 'from'
      if (prev.flightType === 'multicity' && field === 'to' && index < updatedLegs.length - 1) {
        updatedLegs[index + 1] = { ...updatedLegs[index + 1], from: value };
      }
      return { ...prev, legs: updatedLegs };
    });
  };

  // Combined departure date/time handler for custom picker
  const updateLegDateTime = (index: number, combined: Date | null) => {
    setFormState((prev) => {
      const newLegs = prev.legs.map((leg, i) => {
        if (i !== index) return leg;
        if (!combined) {
          return { ...leg, departureDate: null, departureDatePart: null, departureTimePart: null };
        }
        return {
          ...leg,
          departureDate: combined,
          departureDatePart: combined,
          departureTimePart: combined,
        };
      });
      return { ...prev, legs: newLegs };
    });
  };

  // Handlers for return flight date/time parts
  const updateReturnPart = (field: 'returnDatePart' | 'returnTimePart', value: Date | null) => {
    setFormState((prev) => {
      const newState: any = { ...prev, [field]: value };
      const datePart = field === 'returnDatePart' ? value : prev.returnDatePart;
      const timePart = field === 'returnTimePart' ? value : prev.returnTimePart;
      if (datePart && timePart) {
        const combined = new Date(datePart);
        combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
        newState.returnDate = combined;
      } else {
        newState.returnDate = null;
      }
      return newState;
    });
  };

  // Combined return date/time handler for custom picker
  const updateReturnDateTime = (combined: Date | null) => {
    setFormState((prev) => {
      if (!combined) {
        return { ...prev, returnDate: null, returnDatePart: null, returnTimePart: null };
      }
      return { ...prev, returnDate: combined, returnDatePart: combined, returnTimePart: combined };
    });
  };

  // Form handlers
  const handleFlightTypeChange = (type: FlightType) => {
    setFormState((prev) => {
      let newLegs;
      let globalPassengers = prev.passengers;

      if (type === 'multicity') {
        newLegs = prev.legs.map((leg, idx) => ({
          ...leg,
          passengers:
            leg.passengers ||
            (idx === 0
              ? globalPassengers
              : prev.legs[idx - 1]?.passengers || globalPassengers || 0), // Default to 0 if not set
        }));
        if (newLegs.length === 0) {
          newLegs.push({
            from: '',
            to: '',
            departureDate: null,
            departureDatePart: null,
            departureTimePart: null,
            passengers: globalPassengers || 0,
          }); // Default to 0
        }
      } else {
        globalPassengers =
          prev.legs[0]?.passengers !== undefined ? prev.legs[0].passengers : prev.passengers || 0; // Use leg passenger if defined, else global, else 0
        newLegs = [
          {
            from: prev.legs[0]?.from || '',
            to: prev.legs[0]?.to || '',
            departureDate: null,
            departureDatePart: null,
            departureTimePart: null,
            passengers: globalPassengers,
          },
        ];
      }

      // Apply cascading 'from' for multicity
      if (type === 'multicity' && newLegs.length > 1) {
        for (let i = 1; i < newLegs.length; i++) {
          newLegs[i] = { ...newLegs[i], from: newLegs[i - 1].to };
        }
      }

      return {
        ...prev,
        flightType: type,
        legs: newLegs,
        passengers: globalPassengers,
        returnDate: type === 'return' ? prev.returnDate : null,
        returnDatePart: type === 'return' ? prev.returnDatePart : null,
        returnTimePart: type === 'return' ? prev.returnTimePart : null,
      };
    });
  };

  const handleCheckboxChange =
    (name: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [name]: event.target.checked }));
    };

  const handleTextChange =
    (name: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [name]: event.target.value }));
    };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      // Save draft to localStorage so it can be submitted after registration/login
      saveDraftToLocalStorage(formState);
      // Store intended redirect so post-auth flow lands on quotes page
      sessionStorage.setItem('postAuthRedirect', '/dashboard/quotes?submitted=true');
      openLoginModal();
      return;
    }

    if (userRole === 'operator') {
      setOperatorModalOpen(true);
      return;
    }

    // Validate legs for identical from and to airports
    for (const leg of formState.legs) {
      if (leg.from && leg.to && leg.from === leg.to) {
        toast.error('Departure and arrival airports cannot be the same', {
          id: DUPLICATE_AIRPORT_ERROR_ID,
          duration: Infinity,
        });
        return;
      }
    }

    // Validate date range for return flights
    if (formState.flightType === 'return') {
      const departureDate = formState.legs[0]?.departureDate;
      const returnDate = formState.returnDate;
      if (departureDate && returnDate) {
        if (departureDate > returnDate) {
          toast.error('Departure date cannot be after return date', {
            id: INVALID_DATE_RANGE_ERROR_ID,
            duration: Infinity,
          });
          return;
        }
        if (returnDate > addDays(departureDate, 30)) {
          toast.error('Return date must be within 30 days of departure.', {
            id: RETURN_MAX_RANGE_ERROR_ID,
            duration: Infinity,
          });
          return;
        }
      }
      toast.dismiss(INVALID_DATE_RANGE_ERROR_ID);
      toast.dismiss(RETURN_MAX_RANGE_ERROR_ID);
    } else if (formState.flightType === 'multicity') {
      for (let i = 1; i < formState.legs.length; i++) {
        const prevLegDate = formState.legs[i - 1]?.departureDate;
        const currentLegDate = formState.legs[i]?.departureDate;
        if (prevLegDate && currentLegDate) {
          if (currentLegDate < prevLegDate) {
            toast.error('Flight dates [and times] must follow in a sequential order.', {
              id: MULTI_CITY_DATE_SEQUENCE_ERROR_ID,
              duration: Infinity,
            });
            return;
          }
          if (currentLegDate > addDays(prevLegDate, 10)) {
            toast.error('Each multi-city flight must be within 10 days of the previous one.', {
              id: MULTI_CITY_MAX_LEG_RANGE_ERROR_ID,
              duration: Infinity,
            });
            return;
          }
        }
      }
      toast.dismiss(MULTI_CITY_DATE_SEQUENCE_ERROR_ID);
      toast.dismiss(MULTI_CITY_MAX_LEG_RANGE_ERROR_ID);
    }

    // Validate form data
    let valid = true;

    // Check flight legs have from/to/date AND passengers for multi-city
    for (const leg of formState.legs) {
      if (
        !leg.from ||
        !leg.to ||
        !leg.departureDate ||
        (formState.flightType === 'multicity' && !(leg.passengers > 0))
      ) {
        valid = false;
        break;
      }
    }
    // For one-way/return, check global passengers if not already covered by leg check
    if (
      (formState.flightType === 'one-way' || formState.flightType === 'return') &&
      !(formState.passengers > 0)
    ) {
      valid = false;
    }

    if (!valid) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Submit quote request to Firestore
    try {
      const tripTypeMap: Record<string, 'oneWay' | 'return' | 'multiCity'> = {
        'one-way': 'oneWay',
        return: 'return',
        multicity: 'multiCity',
      };
      const primaryLeg = formState.legs[0];
      const multiCityRoutes =
        formState.flightType === 'multicity'
          ? formState.legs.map((leg) => ({
              departureAirport: leg.from,
              arrivalAirport: leg.to,
              departureDate: leg.departureDate!,
              flexibleDate: formState.flexibleDates,
            }))
          : undefined;
      const dataToSubmit = {
        tripType: tripTypeMap[formState.flightType],
        departureAirport: primaryLeg.from,
        arrivalAirport: primaryLeg.to,
        departureDate: primaryLeg.departureDate!,
        returnDate: formState.flightType === 'return' ? formState.returnDate! : undefined,
        flexibleDates: formState.flexibleDates,
        passengerCount:
          formState.flightType === 'multicity' ? primaryLeg.passengers : formState.passengers,
        specialRequirements: formState.additionalNotes || undefined,
        twinEngineMin: formState.twinEngineMin,
        multiCityRoutes,
        pressurisedCabin: formState.pressurisedCabin,
        twoCrewMin: formState.twoCrewMin,
        hasPets: formState.hasPets,
        petDetails: formState.petDetails || undefined,
        hasExtraBaggage: formState.hasExtraBaggage,
        baggageDetails: formState.baggageDetails || undefined,
        hasHardBags: formState.hasHardBags,
        hardBagsDetails: formState.hardBagsDetails || undefined,
        additionalNotes: formState.additionalNotes || undefined,
      } as any;

      const requestId = await createQuoteRequest(user.userCode, dataToSubmit);
      await submitQuoteRequest(requestId);
      toast.success('Quote request submitted!');
      router.push('/dashboard/quotes?submitted=true');
    } catch (error: any) {
      console.error('Error submitting quote request:', error);
      toast.error(error.message || 'Failed to submit request');
    }
  };

  // Returns true if all required data for the current flight type is filled
  const isFormComplete = () => {
    const hasValidLegs = formState.legs.every(
      (leg) => leg.from && leg.to && leg.departureDate && leg.from !== leg.to
    );
    const hasMultiCityPassengers =
      formState.flightType === 'multicity'
        ? formState.legs.every((leg) => leg.passengers > 0)
        : true;
    const globalPassengers = formState.passengers > 0;

    if (formState.flightType === 'return') {
      const departureDate = formState.legs[0]?.departureDate;
      const returnDate = formState.returnDate;
      const isValidDateOrder = departureDate && returnDate ? departureDate <= returnDate : true;
      const isWithin30Days =
        departureDate && returnDate ? returnDate <= addDays(departureDate, 30) : true;
      return hasValidLegs && !!returnDate && globalPassengers && isValidDateOrder && isWithin30Days;
    } else if (formState.flightType === 'multicity') {
      if (!hasValidLegs || !hasMultiCityPassengers || formState.legs.length < 2) return false;
      for (let i = 1; i < formState.legs.length; i++) {
        const prevLegDate = formState.legs[i - 1]?.departureDate;
        const currentLegDate = formState.legs[i]?.departureDate;
        if (prevLegDate && currentLegDate) {
          if (currentLegDate < prevLegDate) return false; // Dates out of sequence
          if (currentLegDate > addDays(prevLegDate, 10)) return false; // Too far apart
        }
      }
      return true;
    }
    return hasValidLegs && globalPassengers;
  };

  // Handler to reset form
  const handleReset = () => {
    setFormState(initialFormState);
  };

  // Show the rest of the form only when the primary fields are complete
  const baseFieldsComplete = Boolean(
    formState.legs[0]?.from &&
      formState.legs[0]?.to &&
      formState.legs[0]?.departureDate &&
      (formState.flightType === 'multicity'
        ? formState.legs[0]?.passengers > 0
        : formState.passengers > 0)
  );
  useEffect(() => {
    if (user) {
      const draft = getDraftFromLocalStorage();
      if (draft) {
        const revived = reviveDraft(draft);
        setFormState(revived);
        clearDraftFromLocalStorage();
        handleSubmit(new Event('submit') as any);
      }
    }
  }, [user]);

  return (
    <>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
          pl: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 1, sm: 1.5, md: 2 },
          borderRadius: '12px',
          width: '100%',
          backgroundColor: alpha(theme.palette.common.white, 0.2),
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
          border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
          fontFamily: theme.typography.fontFamily,
        }}
        data-testid="booking-form"
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {/* Flight Type Selection */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              exclusive
              value={formState.flightType}
              onChange={(_, val) => {
                if (val) handleFlightTypeChange(val as FlightType);
              }}
              sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}
            >
              <ToggleButton
                value="one-way"
                sx={{ textTransform: 'none', fontFamily: 'inherit', borderRadius: 1, px: 2 }}
              >
                <ArrowForwardIcon />
                <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>One Way</Typography>
              </ToggleButton>
              <ToggleButton
                value="return"
                sx={{ textTransform: 'none', fontFamily: 'inherit', borderRadius: 1, px: 2 }}
              >
                <SwapHorizIcon />
                <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Return</Typography>
              </ToggleButton>
              <ToggleButton
                value="multicity"
                sx={{ textTransform: 'none', fontFamily: 'inherit', borderRadius: 1, px: 2 }}
              >
                <MultipleStopIcon />
                <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Multi-city</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Flight Legs */}
          {formState.legs.map((leg, index) => (
            <Box
              key={index}
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.0),
                backgroundColor: alpha(theme.palette.background.default, 1.0),
              }}
            >
              {formState.flightType === 'multicity' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'inherit' }}>
                    Flight {index + 1}
                  </Typography>
                  {formState.legs.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeFlightLeg(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              )}

              <Box
                sx={{ display: 'flex', flexWrap: 'nowrap', gap: 2, mb: 2, alignItems: 'center' }}
              >
                {/* From Airport */}
                <Box
                  sx={{
                    flex: 1.5,
                    minWidth: 0,
                    // Square right corners for the From field
                    '& .MuiOutlinedInput-root': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                  }}
                >
                  <AirportSelect
                    label="From"
                    value={leg.from}
                    onChange={(value: string) => updateLeg(index, 'from', value)}
                    disabled={formState.flightType === 'multicity' && index > 0}
                    error={undefined}
                  />
                </Box>

                {/* To Airport */}
                <Box sx={{ flex: 1.5, minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
                  <AirportSelect
                    label="To"
                    value={leg.to}
                    onChange={(value: string) => updateLeg(index, 'to', value)}
                    error={undefined}
                  />
                </Box>

                {/* Departure Date & Time */}
                <Box sx={{ flex: 1, minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
                  <CustomDateTimePicker
                    label={
                      formState.flightType === 'multicity'
                        ? `Flight ${index + 1} Date & Time`
                        : 'Departure Date & Time'
                    }
                    value={leg.departureDate}
                    onChange={(newDate) => updateLegDateTime(index, newDate)}
                    minDate={
                      formState.flightType === 'multicity' &&
                      index > 0 &&
                      formState.legs[index - 1]?.departureDate
                        ? formState.legs[index - 1].departureDate!
                        : new Date()
                    }
                    maxDate={
                      formState.flightType === 'multicity' &&
                      index > 0 &&
                      formState.legs[index - 1]?.departureDate
                        ? addDays(formState.legs[index - 1].departureDate!, 10)
                        : addMonths(new Date(), 12)
                    }
                    required
                  />
                </Box>

                {/* Return Date & Time - Conditionally rendered for the first leg of a return flight */}
                {formState.flightType === 'return' && index === 0 && (
                  <Box
                    sx={{ flex: 1, minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  >
                    <CustomDateTimePicker
                      label="Return Date & Time"
                      value={formState.returnDate}
                      onChange={updateReturnDateTime}
                      minDate={formState.legs[0]?.departureDate || new Date()}
                      maxDate={
                        formState.legs[0]?.departureDate
                          ? addDays(formState.legs[0].departureDate, 30)
                          : addMonths(new Date(), 12)
                      }
                      required
                    />
                  </Box>
                )}

                {/* Passenger input for ONE-WAY or RETURN (global passengers) - only on first leg */}
                {(formState.flightType === 'one-way' || formState.flightType === 'return') &&
                  index === 0 && (
                    <Box
                      sx={{
                        flex: 0.7,
                        minWidth: 0,
                        // Square left corners of the passenger field
                        '& .MuiOutlinedInput-root': {
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                        },
                        '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                        },
                      }}
                    >
                      <TextField
                        id="global-passengers"
                        autoComplete="off"
                        name="passengers"
                        value={formState.passengers > 0 ? formState.passengers : ''}
                        placeholder="-"
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 300) {
                            setFormState((prev) => ({ ...prev, passengers: val }));
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlineIcon />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                <IconButton
                                  onClick={() => incrementPassengers()}
                                  disabled={formState.passengers >= 300}
                                  size="small"
                                >
                                  <AddIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => decrementPassengers()}
                                  disabled={formState.passengers <= 1}
                                  size="small"
                                >
                                  <RemoveIcon />
                                </IconButton>
                              </Box>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ min: 1, max: 300, style: { textAlign: 'center' } }}
                        fullWidth
                        sx={{ fontFamily: 'inherit' }}
                      />
                    </Box>
                  )}

                {/* Passengers Inline - For MULTI-CITY (per-leg passengers) */}
                {formState.flightType === 'multicity' && (
                  <Box
                    sx={{
                      flex: 0.7,
                      minWidth: 0,
                      // Square left corners of the per-leg passenger field
                      '& .MuiOutlinedInput-root': {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      },
                      '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      },
                    }}
                  >
                    <TextField
                      id={`leg-${index}-passengers`}
                      autoComplete="off"
                      name={`leg${index}Passengers`}
                      value={leg.passengers > 0 ? leg.passengers : ''}
                      placeholder="-"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= 300) {
                          updateLegPassengers(index, val);
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <IconButton
                                onClick={() => incrementPassengers(index)}
                                disabled={leg.passengers >= 300}
                                size="small"
                              >
                                <AddIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => decrementPassengers(index)}
                                disabled={leg.passengers <= 1}
                                size="small"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Box>
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 1, max: 300, style: { textAlign: 'center' } }}
                      fullWidth
                      sx={{ fontFamily: 'inherit' }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          ))}

          {/* Add Flight button for multicity - Ensure this is outside the map and correctly placed */}
          {formState.flightType === 'multicity' && (
            <Box sx={{ mb: 3, mt: 0, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addFlightLeg}
                disabled={formState.legs.length >= 4}
                sx={{ fontFamily: 'inherit', textTransform: 'uppercase' }}
              >
                Add Flight
              </Button>
            </Box>
          )}

          {/* Slide-in Additional Options and Submission */}
          <Collapse in={baseFieldsComplete} timeout="auto" unmountOnExit>
            {/* Additional Options */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
                onClick={() => setShowAdditionalOptions((prev) => !prev)}
              >
                <Typography variant="h6" gutterBottom sx={{ fontFamily: 'inherit' }}>
                  Additional Options
                </Typography>
                <IconButton
                  size="small"
                  sx={{ fontFamily: 'inherit' }}
                >
                  {showAdditionalOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={showAdditionalOptions}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontFamily: 'inherit',
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <FlightTakeoffIcon fontSize="small" />
                  Aircraft Options
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.twinEngineMin}
                        onChange={handleCheckboxChange('twinEngineMin')}
                      />
                    }
                    label={
                      <Typography sx={{ fontFamily: 'inherit' }}>Twin Engine Minimum</Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.pressurisedCabin}
                        onChange={handleCheckboxChange('pressurisedCabin')}
                      />
                    }
                    label={
                      <Typography sx={{ fontFamily: 'inherit' }}>Pressurised Cabin</Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.twoCrewMin}
                        onChange={handleCheckboxChange('twoCrewMin')}
                      />
                    }
                    label={<Typography sx={{ fontFamily: 'inherit' }}>Two Crew Minimum</Typography>}
                  />
                </Box>

                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontFamily: 'inherit',
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LuggageIcon fontSize="small" />
                  Baggage Options
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.hasExtraBaggage}
                        onChange={handleCheckboxChange('hasExtraBaggage')}
                      />
                    }
                    label={<Typography sx={{ fontFamily: 'inherit' }}>Extra Baggage</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.hasPets}
                        onChange={handleCheckboxChange('hasPets')}
                      />
                    }
                    label={
                      <Typography sx={{ fontFamily: 'inherit' }}>Traveling with Pets</Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formState.hasHardBags}
                        onChange={handleCheckboxChange('hasHardBags')}
                      />
                    }
                    label={<Typography sx={{ fontFamily: 'inherit' }}>Hard Bags</Typography>}
                  />
                </Box>
                {/* Conditional Baggage fields */}
                {formState.hasExtraBaggage && (
                  <TextField
                    id="baggage-details"
                    name="baggageDetails"
                    fullWidth
                    margin="normal"
                    label="Extra Baggage Details"
                    placeholder="Number of bags, total weight, dimensions, etc."
                    value={formState.baggageDetails}
                    onChange={handleTextChange('baggageDetails')}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'inherit' },
                      '& .MuiInputBase-root': { fontFamily: 'inherit' },
                    }}
                  />
                )}
                {/* Conditional Pets fields under Baggage */}
                {formState.hasPets && (
                  <TextField
                    id="pet-details"
                    name="petDetails"
                    fullWidth
                    margin="normal"
                    label="Pet Details"
                    placeholder="Type, weight, crate dimensions, etc."
                    value={formState.petDetails}
                    onChange={handleTextChange('petDetails')}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'inherit' },
                      '& .MuiInputBase-root': { fontFamily: 'inherit' },
                    }}
                  />
                )}
                {/* Conditional Hard Bags fields under Baggage */}
                {formState.hasHardBags && (
                  <TextField
                    id="hard-bags-details"
                    name="hardBagsDetails"
                    fullWidth
                    margin="normal"
                    label="Hard Bags Details"
                    placeholder="Number and dimensions, etc."
                    value={formState.hardBagsDetails}
                    onChange={handleTextChange('hardBagsDetails')}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'inherit' },
                      '& .MuiInputBase-root': { fontFamily: 'inherit' },
                    }}
                  />
                )}
                {/* Additional Notes */}
                <TextField
                  id="additional-notes"
                  name="additionalNotes"
                  fullWidth
                  margin="normal"
                  label="Additional Notes"
                  placeholder="Any other requirements or information"
                  multiline
                  rows={3}
                  value={formState.additionalNotes}
                  onChange={handleTextChange('additionalNotes')}
                  sx={{
                    '& .MuiInputLabel-root': { fontFamily: 'inherit' },
                    '& .MuiInputBase-root': { fontFamily: 'inherit' },
                  }}
                />
              </Collapse>
            </Box>

            {/* Submit Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={!isFormComplete()}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Submit Quote Request
              </Button>
            </Box>

            {/* Reset Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleReset}
                sx={{
                  textTransform: 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                }}
              >
                Reset form
              </Button>
            </Box>
          </Collapse>
        </LocalizationProvider>
      </Paper>

      {/* Operator Modal */}
      <Dialog open={operatorModalOpen} onClose={() => setOperatorModalOpen(false)}>
        <DialogTitle sx={{ fontFamily: 'inherit' }}>Operator Account Restriction</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'inherit' }}>
            Operator accounts cannot request quotes. Please create a passenger account to request
            charter flights.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOperatorModalOpen(false)} sx={{ fontFamily: 'inherit' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOperatorModalOpen(false);
              openRegisterModal('passenger');
            }}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ fontFamily: 'inherit', textTransform: 'uppercase' }}
          >
            Register as Passenger
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
