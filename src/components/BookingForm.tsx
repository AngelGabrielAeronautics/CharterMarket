'use client';

import React, { useState, useMemo, forwardRef, useEffect } from 'react';
import {
  Paper,
  TextField,
  Box,
  Button,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  GlobalStyles,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  DatePicker,
  DatePickerToolbar,
  DatePickerToolbarProps,
} from '@mui/x-date-pickers/DatePicker';
import {
  DateTimePicker,
  DateTimePickerToolbar,
  DateTimePickerToolbarProps,
} from '@mui/x-date-pickers/DateTimePicker';
import { useTheme, alpha } from '@mui/material/styles';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Autocomplete from '@mui/material/Autocomplete';
import airports from 'airports';
import { addMonths } from 'date-fns';
import { PickersActionBar, PickersActionBarProps } from '@mui/x-date-pickers/PickersActionBar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  PickersLayoutProps,
  usePickerLayout,
  PickersLayoutRoot,
  pickersLayoutClasses,
  PickersLayoutContentWrapper,
} from '@mui/x-date-pickers/PickersLayout';
import { enUS, enGB, de, fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';
import { createQuoteRequest, submitQuoteRequest } from '@/lib/flight';
import toast from 'react-hot-toast';
import { TripType, QuoteRequestFormData } from '@/types/flight';

interface BookingFormState {
  from: string;
  to: string;
  departureDate: Date | null;
  returnDate: Date | null;
  oneWayDepartureDateEstimate: boolean;
  returnDepartureDateEstimate: boolean;
  returnReturnDateEstimate: boolean;
  departureTime: string;
  passengers: string;
  multiCityLegs: Array<{
    from: string;
    to: string;
    departureDate: Date | null;
    departureDateEstimate: boolean;
  }>;
}

export default function BookingForm() {
  const theme = useTheme();
  const [activeLocale, setActiveLocale] = useState(enUS);
  const { user, userRole, profile } = useAuth();
  const { openLoginModal, openRegisterModal } = useModal();
  const router = useRouter();
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [twinEngineMin, setTwinEngineMin] = useState<boolean>(false);
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language;
      if (browserLang.startsWith('en-GB')) {
        setActiveLocale(enGB);
      } else if (browserLang.startsWith('de')) {
        setActiveLocale(de);
      } else if (browserLang.startsWith('fr')) {
        setActiveLocale(fr);
      }
    }
  }, []);

  const [searchForm, setSearchForm] = useState<BookingFormState>({
    from: '',
    to: '',
    departureDate: null,
    returnDate: null,
    oneWayDepartureDateEstimate: false,
    returnDepartureDateEstimate: false,
    returnReturnDateEstimate: false,
    departureTime: '',
    passengers: '-',
    multiCityLegs: [{ from: '', to: '', departureDate: null, departureDateEstimate: false }],
  });
  const [flightType, setFlightType] = useState<'one-way' | 'return' | 'multicity' | ' ' | ''>('');
  const [oneWayStep, setOneWayStep] = useState<number>(1);
  const [returnStep, setReturnStep] = useState<number>(1);
  const [multiCityStep, setMultiCityStep] = useState<number>(1);
  const [completedLegs, setCompletedLegs] = useState<number[]>([]);

  const [openOneWay, setOpenOneWay] = useState<boolean>(false);
  const [openReturnDeparturePicker, setOpenReturnDeparturePicker] = useState<boolean>(false);
  const [openReturnReturnPicker, setOpenReturnReturnPicker] = useState<boolean>(false);
  const [openMultiCityPickers, setOpenMultiCityPickers] = useState<boolean[]>([false]);

  const [initialOneWayDate, setInitialOneWayDate] = useState<Date | null>(null);
  const [initialReturnDepartureDate, setInitialReturnDepartureDate] = useState<Date | null>(null);
  const [initialReturnReturnDate, setInitialReturnReturnDate] = useState<Date | null>(null);
  const [initialMultiCityDates, setInitialMultiCityDates] = useState<Array<Date | null>>([null]);

  const airportOptions = useMemo(() => {
    const seen = new Set<string>();
    return airports.filter((airport: any) => {
      const code = airport.iata;
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }, []);

  const getOptionLabelString = (option: any): string =>
    typeof option === 'string' ? option : `${option.name} (${option.iata})`;
  const fromHasResults = airportOptions.some((opt) =>
    getOptionLabelString(opt).toLowerCase().includes(searchForm.from.toLowerCase())
  );
  const toHasResults = airportOptions.some((opt) =>
    getOptionLabelString(opt).toLowerCase().includes(searchForm.to.toLowerCase())
  );

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'passengers') {
      if (value === '') {
        newValue = '-';
      } else if (value === '-') {
        newValue = '-';
      } else if (/^[1-9]\d*$/.test(value)) {
        const num = parseInt(value, 10);
        if (num >= 1 && num <= 500) {
          newValue = value;
        } else {
          newValue = String(Math.min(500, Math.max(1, num)));
        }
      } else {
        newValue = '1';
      }

      setSearchForm((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      if (flightType === 'one-way') {
        if (searchForm.departureDate && newValue !== '-') {
          setOneWayStep(3);
        } else if (searchForm.departureDate && newValue === '-') {
          if (oneWayStep === 3) setOneWayStep(2);
        }
      } else if (flightType === 'return') {
        if (searchForm.departureDate && searchForm.returnDate && newValue !== '-') {
          setReturnStep(4); // All conditions met for submit
        } else if (searchForm.departureDate && searchForm.returnDate && newValue === '-') {
          if (returnStep === 4) setReturnStep(3); // Revert to expecting passengers
        }
      }
      return;
    }
    setSearchForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleIncrementPassengers = () => {
    setSearchForm((prev) => {
      let newPax;
      if (prev.passengers === '-') {
        newPax = '1';
      } else {
        const currentPax = parseInt(prev.passengers, 10);
        newPax = String(Math.min(500, currentPax + 1));
      }
      if (flightType === 'one-way' && prev.departureDate && newPax !== '-') {
        setOneWayStep(3);
      } else if (
        flightType === 'return' &&
        prev.departureDate &&
        prev.returnDate &&
        newPax !== '-'
      ) {
        setReturnStep(4);
      }
      return { ...prev, passengers: newPax };
    });
  };

  const handleDecrementPassengers = () => {
    setSearchForm((prev) => {
      let newPax;
      if (prev.passengers === '-') {
        return prev;
      }
      const currentPax = parseInt(prev.passengers, 10);
      if (currentPax === 1) {
        newPax = '-';
      } else {
        newPax = String(Math.max(1, currentPax - 1));
      }
      if (flightType === 'one-way' && prev.departureDate && newPax === '-') {
        if (oneWayStep === 3) setOneWayStep(2);
      } else if (
        flightType === 'return' &&
        prev.departureDate &&
        prev.returnDate &&
        newPax === '-'
      ) {
        if (returnStep === 4) setReturnStep(3);
      }
      return { ...prev, passengers: newPax };
    });
  };

  const submitRequest = async () => {
    if (!user || !user.userCode) {
      toast.error('User information not available. Please log in again.');
      return;
    }
    try {
      const tripTypeValue = (
        flightType === 'one-way' ? 'oneWay' : flightType === 'return' ? 'return' : 'multiCity'
      ) as TripType;

      // Create a formatted extras string for the special requirements field
      let specialRequirements = '';

      if (hasFlexibleTimes) specialRequirements += '• Flexible times\n';
      if (hasFlexibleDates) specialRequirements += '• Flexible dates\n';

      if (hasPets) {
        specialRequirements += '• Traveling with pets\n';
        if (petDetails) specialRequirements += `  Details: ${petDetails}\n`;
      }

      if (hasExtraBaggage) {
        specialRequirements += '• Extra baggage requested\n';
        if (baggageDetails) specialRequirements += `  Details: ${baggageDetails}\n`;
      }

      if (hasHardBags) {
        specialRequirements += '• Hard bags/special equipment\n';
        if (hardBagDetails) specialRequirements += `  Details: ${hardBagDetails}\n`;
      }

      if (additionalRequirements) {
        specialRequirements += '• Additional requirements:\n';
        specialRequirements += `  ${additionalRequirements}\n`;
      }

      // Create the multiCityRoutes array if needed
      const multiCityRoutes =
        tripTypeValue === 'multiCity'
          ? searchForm.multiCityLegs.map((leg) => ({
              departureAirport: leg.from,
              arrivalAirport: leg.to,
              departureDate: leg.departureDate!,
              flexibleDate: leg.departureDateEstimate,
            }))
          : undefined;

      const requestData: QuoteRequestFormData = {
        tripType: tripTypeValue,
        departureAirport: searchForm.from,
        arrivalAirport: searchForm.to,
        departureDate: searchForm.departureDate!,
        returnDate:
          flightType === 'return' && searchForm.returnDate ? searchForm.returnDate : undefined,
        flexibleDates:
          flightType === 'one-way'
            ? searchForm.oneWayDepartureDateEstimate || hasFlexibleDates
            : searchForm.returnDepartureDateEstimate ||
              searchForm.returnReturnDateEstimate ||
              hasFlexibleDates,
        passengerCount: Number(searchForm.passengers) || 1,
        cabinClass: 'standard',
        twinEngineMin,
        specialRequirements: specialRequirements.trim() || null,
        multiCityRoutes,
      };

      console.log('Submitting quote request:', {
        user: user.userCode,
        departureAirport: requestData.departureAirport,
        arrivalAirport: requestData.arrivalAirport,
        passengerCount: requestData.passengerCount,
        specialRequirements: requestData.specialRequirements,
      });

      const requestId = await createQuoteRequest(user.userCode, requestData);

      await submitQuoteRequest(requestId);

      console.log('Quote request created and submitted:', requestId);

      toast.success('Quote request submitted!');
      router.push('/dashboard/quotes?submitted=true');
    } catch (err) {
      console.error('Error submitting quote request', err);
      toast.error('Failed to submit quote request. Please try again.');
    }
  };

  useEffect(() => {
    if (pendingSubmission && user) {
      submitRequest();
      setPendingSubmission(false);
    }
  }, [pendingSubmission, user]);

  const resetDependentFields = (level: 'fromTo' | 'flightType' | 'dateStatus') => {
    if (level === 'fromTo') {
      setFlightType('');
      setSearchForm((prev) => ({
        ...prev,
        departureDate: null,
        returnDate: null,
        oneWayDepartureDateEstimate: false,
        returnDepartureDateEstimate: false,
        returnReturnDateEstimate: false,
        departureTime: '',
        passengers: '-',
        multiCityLegs: [{ from: '', to: '', departureDate: null, departureDateEstimate: false }],
      }));
      setOneWayStep(1);
      setReturnStep(1);
      setMultiCityStep(1);
      setCompletedLegs([]);
      setOpenMultiCityPickers([false]);
      setInitialMultiCityDates([null]);
    } else if (level === 'flightType') {
      setSearchForm((prev) => ({
        ...prev,
        departureDate: null,
        returnDate: null,
        oneWayDepartureDateEstimate: false,
        returnDepartureDateEstimate: false,
        returnReturnDateEstimate: false,
        departureTime: '',
        passengers: '-',
        multiCityLegs: [{ from: '', to: '', departureDate: null, departureDateEstimate: false }],
      }));
      setOneWayStep(1);
      setReturnStep(1);
      setMultiCityStep(1);
      setCompletedLegs([]);
      setOpenMultiCityPickers([false]);
      setInitialMultiCityDates([null]);
    } else if (level === 'dateStatus') {
      setSearchForm((prev) => ({
        ...prev,
        departureDate: null,
        returnDate: null,
        oneWayDepartureDateEstimate: false,
        returnDepartureDateEstimate: false,
        returnReturnDateEstimate: false,
        departureTime: '',
        passengers: '-',
        multiCityLegs: [{ from: '', to: '', departureDate: null, departureDateEstimate: false }],
      }));
      setOneWayStep(1);
      setReturnStep(1);
      setMultiCityStep(1);
      setCompletedLegs([]);
      setOpenMultiCityPickers([false]);
      setInitialMultiCityDates([null]);
    }
  };

  const handleAddLeg = () => {
    if (searchForm.multiCityLegs.length >= 4) return;

    const previousLegTo = searchForm.multiCityLegs[searchForm.multiCityLegs.length - 1].to;

    setSearchForm((prev) => ({
      ...prev,
      multiCityLegs: [
        ...prev.multiCityLegs,
        { from: previousLegTo, to: '', departureDate: null, departureDateEstimate: false },
      ],
    }));
    setOpenMultiCityPickers((prev) => [...prev, false]);
    setInitialMultiCityDates((prev) => [...prev, null]);
  };

  const handleMultiCityLegChange = (
    legIndex: number,
    field: keyof (typeof searchForm.multiCityLegs)[0],
    value: any
  ) => {
    setSearchForm((prev) => {
      const updatedLegs = [...prev.multiCityLegs];
      updatedLegs[legIndex] = { ...updatedLegs[legIndex], [field]: value };

      if (legIndex === 0 && field === 'departureDate' && value) {
        setMultiCityStep(3);
      } else if (legIndex === 0 && field === 'departureDate' && !value) {
        setMultiCityStep(2);
      }

      return { ...prev, multiCityLegs: updatedLegs };
    });
  };

  const isLegComplete = (legIndex: number) => {
    const leg = searchForm.multiCityLegs[legIndex];
    return leg.from && leg.to && leg.departureDate;
  };

  const handleOpenMultiCityPicker = (legIndex: number) => {
    const newOpenState = [...openMultiCityPickers];
    newOpenState[legIndex] = true;
    setOpenMultiCityPickers(newOpenState);

    const newInitialDates = [...initialMultiCityDates];
    newInitialDates[legIndex] = searchForm.multiCityLegs[legIndex].departureDate;
    setInitialMultiCityDates(newInitialDates);
  };

  const handleCloseMultiCityPicker = (legIndex: number) => {
    const newOpenState = [...openMultiCityPickers];
    newOpenState[legIndex] = false;
    setOpenMultiCityPickers(newOpenState);
  };

  const CustomPickerLayout = forwardRef<HTMLDivElement, PickersLayoutProps<Date | null>>(
    (props, ref) => {
      const { content, actionBar, ownerState } = usePickerLayout(props);
      const estimateChecked = (ownerState as any).estimateChecked as boolean;
      const onEstimateChange = (ownerState as any).onEstimateChange as (
        event: React.ChangeEvent<HTMLInputElement>
      ) => void;

      return (
        <PickersLayoutRoot
          ref={ref}
          className={pickersLayoutClasses.root}
          ownerState={ownerState}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <PickersLayoutContentWrapper
            className={pickersLayoutClasses.contentWrapper}
            ownerState={ownerState}
            sx={{ flexGrow: 1, display: 'flex' }}
          >
            {content}
          </PickersLayoutContentWrapper>

          <Box
            sx={{
              px: 2,
              py: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox size="small" checked={estimateChecked} onChange={onEstimateChange} />
              }
              label="I don't have a set date yet"
              sx={{ flexShrink: 0 }}
            />
          </Box>

          <Box sx={{ flexGrow: 0, flexShrink: 0 }}>{actionBar}</Box>
        </PickersLayoutRoot>
      );
    }
  );
  CustomPickerLayout.displayName = 'CustomPickerLayout';

  interface AugmentedActionBarProps extends PickersActionBarProps {
    customOnClose?: () => void;
    customOnReset?: () => void;
    customOnCancelAndReset?: () => void;
  }

  const CustomActionBar = (props: AugmentedActionBarProps) => {
    const { customOnClose, customOnReset, customOnCancelAndReset } = props;
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button onClick={() => customOnReset?.()} color="inherit">
          Reset
        </Button>
        <Box>
          <Button onClick={() => customOnCancelAndReset?.()} color="inherit" sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button onClick={() => customOnClose?.()} variant="contained">
            OK
          </Button>
        </Box>
      </Box>
    );
  };

  const isLeg0FromToFilled = searchForm.from && searchForm.to;
  const isLeg0DateFilled = searchForm.multiCityLegs[0]?.departureDate;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!user) {
      openLoginModal();
      setPendingSubmission(true);
      return;
    }

    // Check if user is an operator
    if (userRole === 'operator') {
      // Open modal explaining operators cannot request quotes
      setOperatorModalOpen(true);
      return;
    }

    submitRequest();
  };

  // Highlight next field in sequence
  const highlightFrom = !searchForm.from;
  const highlightTo = !!searchForm.from && !searchForm.to;
  const highlightFlightType = !!searchForm.from && !!searchForm.to && !flightType;
  const highlightOneWayDate = flightType === 'one-way' && !searchForm.departureDate;
  const highlightOneWayPassengers =
    flightType === 'one-way' &&
    !!searchForm.departureDate &&
    (!searchForm.passengers || searchForm.passengers === '-');
  const highlightReturnDeparture = flightType === 'return' && !searchForm.departureDate;
  const highlightReturnReturn =
    flightType === 'return' && !!searchForm.departureDate && !searchForm.returnDate;
  const highlightReturnPassengers =
    flightType === 'return' &&
    !!searchForm.departureDate &&
    !!searchForm.returnDate &&
    (!searchForm.passengers || searchForm.passengers === '-');
  const highlightMultiDate =
    flightType === 'multicity' && !searchForm.multiCityLegs[0].departureDate;
  const highlightMultiPassengers =
    flightType === 'multicity' &&
    !!searchForm.multiCityLegs[0].departureDate &&
    (!searchForm.passengers || searchForm.passengers === '-');

  // New states for extras
  const [hasFlexibleTimes, setHasFlexibleTimes] = useState(false);
  const [hasFlexibleDates, setHasFlexibleDates] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState('');
  const [hasExtraBaggage, setHasExtraBaggage] = useState(false);
  const [baggageDetails, setBaggageDetails] = useState('');
  const [hasHardBags, setHasHardBags] = useState(false);
  const [hardBagDetails, setHardBagDetails] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={activeLocale}>
        <GlobalStyles
          styles={{
            '.MuiMultiSectionDigitalClockSection-root .MuiTypography-root': {
              fontSize: '0.75rem !important',
            },
            '.MuiMultiSectionDigitalClock-sectionSeparator .MuiTypography-root, .MuiPickersToolbar-ampmLabel, .MuiPickersToolbar-ampmSelection .MuiTypography-root':
              {
                fontSize: '0.75rem !important',
              },
            '.MuiClockNumber-root': {
              fontSize: '0.75rem !important',
            },
          }}
        />
        <Paper
          component="form"
          noValidate
          onSubmit={handleSubmit}
          elevation={6}
          sx={{
            p: { xs: 1, sm: 2, md: 3 },
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            backgroundColor: alpha(theme.palette.common.white, 0.9),
          }}
        >
          {flightType === 'multicity' && (
            <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>
              Leg 1
            </Typography>
          )}
          <Autocomplete
            freeSolo
            options={airportOptions}
            getOptionLabel={(option: any) =>
              typeof option === 'string' ? option : `${option.name} (${option.iata})`
            }
            value={airportOptions.find((a: any) => a.iata === searchForm.from) || null}
            onChange={(_, value: any) => {
              const newVal = typeof value === 'string' ? value : value?.iata || '';
              const previousFrom = searchForm.from;
              setSearchForm((prev) => ({ ...prev, from: newVal }));

              if (flightType === 'multicity') {
                handleMultiCityLegChange(0, 'from', newVal);
                if (!newVal && previousFrom) {
                  resetDependentFields('fromTo');
                } else if (newVal && newVal !== previousFrom) {
                  resetDependentFields('flightType');
                }
              } else {
                if (newVal !== previousFrom) {
                  resetDependentFields('fromTo');
                }
              }
            }}
            onInputChange={(_, inputValue, reason) => {
              if (reason === 'input') {
                setSearchForm((prev) => ({ ...prev, from: inputValue }));
                if (flightType === 'multicity') {
                  handleMultiCityLegChange(0, 'from', inputValue);
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="from"
                required
                placeholder="From"
                variant="outlined"
                size="medium"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <FlightTakeoffIcon color="action" />
                      </InputAdornment>
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  flex: '1 1 180px',
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: searchForm.from ? '#fdfaf6' : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'transparent !important',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                  },
                }}
              />
            )}
            sx={{
              flex: '1 1 180px',
              minWidth: 120,
              border: highlightFrom ? `2px solid ${theme.palette.error.main}` : undefined,
              borderRadius: 1,
            }}
          />
          <Autocomplete
            freeSolo
            options={airportOptions}
            getOptionLabel={(option: any) =>
              typeof option === 'string' ? option : `${option.name} (${option.iata})`
            }
            value={airportOptions.find((a: any) => a.iata === searchForm.to) || null}
            onChange={(_, value: any) => {
              const newVal = typeof value === 'string' ? value : value?.iata || '';
              const previousTo = searchForm.to;
              setSearchForm((prev) => ({ ...prev, to: newVal }));

              if (flightType === 'multicity') {
                handleMultiCityLegChange(0, 'to', newVal);
                if (!newVal && previousTo) {
                  resetDependentFields('fromTo');
                } else if (newVal && newVal !== previousTo) {
                  resetDependentFields('flightType');
                }
              } else {
                if (newVal !== previousTo) {
                  resetDependentFields('fromTo');
                }
              }
            }}
            onInputChange={(_, inputValue, reason) => {
              if (reason === 'input') {
                setSearchForm((prev) => ({ ...prev, to: inputValue }));
                if (flightType === 'multicity') {
                  handleMultiCityLegChange(0, 'to', inputValue);
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="to"
                required
                placeholder="To"
                variant="outlined"
                size="medium"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <FlightLandIcon color="action" />
                      </InputAdornment>
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  flex: '1 1 180px',
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: searchForm.to ? '#fdfaf6' : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'transparent !important',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                  },
                }}
              />
            )}
            sx={{
              flex: '1 1 180px',
              minWidth: 120,
              border: highlightTo ? `2px solid ${theme.palette.error.main}` : undefined,
              borderRadius: 1,
            }}
          />

          {/* Multi-city first leg departure date - inline next to To field */}
          {flightType === 'multicity' && isLeg0FromToFilled && (
            <Box sx={{ cursor: 'pointer', flex: '1 1 150px', minWidth: 150 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={activeLocale}>
                <DateTimePicker
                  label="Departure Date"
                  value={searchForm.multiCityLegs[0].departureDate}
                  onChange={(newDate) => {
                    handleMultiCityLegChange(0, 'departureDate', newDate);
                  }}
                  minDateTime={new Date()}
                  maxDateTime={addMonths(new Date(), 18)}
                  views={
                    searchForm.multiCityLegs[0].departureDateEstimate
                      ? ['year', 'month']
                      : ['year', 'month', 'day', 'hours', 'minutes']
                  }
                  openTo={searchForm.multiCityLegs[0].departureDateEstimate ? 'month' : 'day'}
                  orientation="landscape"
                  ampm={false}
                  open={openMultiCityPickers[0]}
                  onOpen={() => handleOpenMultiCityPicker(0)}
                  onClose={() => handleCloseMultiCityPicker(0)}
                  slots={{
                    layout: CustomPickerLayout,
                    actionBar: CustomActionBar,
                    toolbar: undefined,
                  }}
                  slotProps={{
                    actionBar: {
                      customOnClose: () => handleCloseMultiCityPicker(0),
                      customOnReset: () =>
                        handleMultiCityLegChange(0, 'departureDate', initialMultiCityDates[0]),
                      customOnCancelAndReset: () => {
                        handleMultiCityLegChange(0, 'departureDate', initialMultiCityDates[0]);
                        handleCloseMultiCityPicker(0);
                      },
                    } as AugmentedActionBarProps,
                    layout: {
                      estimateChecked: searchForm.multiCityLegs[0].departureDateEstimate,
                      onEstimateChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        handleMultiCityLegChange(0, 'departureDateEstimate', e.target.checked),
                    } as any,
                  }}
                  enableAccessibleFieldDOMStructure={false}
                />
              </LocalizationProvider>
            </Box>
          )}

          {/* Multi-city first leg passengers - appears after Leg 1 Date is filled */}
          {flightType === 'multicity' && isLeg0DateFilled && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(2),
                border: highlightMultiPassengers
                  ? `2px solid ${theme.palette.error.main}`
                  : undefined,
                borderRadius: 1,
              }}
            >
              <TextField
                placeholder="Passengers"
                name="passengers"
                type="text"
                value={searchForm.passengers}
                onChange={(e) => {
                  handleSearchChange(e);
                  if (e.target.value && e.target.value !== '-') {
                    setMultiCityStep(4);
                  } else {
                    setMultiCityStep(3);
                  }
                }}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleDecrementPassengers}
                        size="small"
                        disabled={searchForm.passengers === '-'}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={handleIncrementPassengers}
                        size="small"
                        disabled={searchForm.passengers === '500'}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  inputProps: { min: 1, max: 500 },
                }}
                sx={{
                  width: 'auto',
                  minWidth: '150px',
                  maxWidth: '250px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor:
                      searchForm.passengers && searchForm.passengers !== '-'
                        ? '#fdfaf6'
                        : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'transparent !important',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor:
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.23)'
                            : 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* One-Way Flight Options */}
          {flightType === 'one-way' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(2),
                border: highlightOneWayDate ? `2px solid ${theme.palette.error.main}` : undefined,
                borderRadius: 1,
              }}
            >
              <Box sx={{ cursor: 'pointer' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={activeLocale}>
                  <DateTimePicker
                    label="Departure Date"
                    value={searchForm.departureDate}
                    onChange={(newDate) => {
                      setSearchForm((prev) => ({ ...prev, departureDate: newDate }));
                      if (newDate) setOneWayStep(2);
                      else setOneWayStep(1);
                    }}
                    minDateTime={new Date()}
                    maxDateTime={addMonths(new Date(), 18)}
                    views={
                      searchForm.oneWayDepartureDateEstimate
                        ? ['year', 'month']
                        : ['year', 'month', 'day', 'hours', 'minutes']
                    }
                    openTo={searchForm.oneWayDepartureDateEstimate ? 'month' : 'day'}
                    ampm={false}
                    open={openOneWay}
                    onOpen={() => {
                      setOpenOneWay(true);
                      setInitialOneWayDate(searchForm.departureDate);
                    }}
                    onClose={() => setOpenOneWay(false)}
                    slots={{
                      layout: CustomPickerLayout,
                      actionBar: CustomActionBar,
                      toolbar: undefined,
                      textField: (propsFromPicker) => {
                        const originalFormattedValue =
                          typeof propsFromPicker.value === 'string' ? propsFromPicker.value : '';
                        const displayValue = originalFormattedValue.endsWith(' 00:00')
                          ? originalFormattedValue.substring(
                              0,
                              originalFormattedValue.length - ' 00:00'.length
                            ) + ' --:--'
                          : originalFormattedValue;
                        const handleDisplayChange = (
                          event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                        ) => {
                          let textFromInput = event.target.value;
                          if (textFromInput.endsWith(' --:--')) {
                            textFromInput =
                              textFromInput.substring(0, textFromInput.length - ' --:--'.length) +
                              ' 00:00';
                          }
                          const modifiedEvent = {
                            ...event,
                            target: { ...event.target, value: textFromInput },
                          };
                          if (propsFromPicker.onChange) {
                            propsFromPicker.onChange(
                              modifiedEvent as React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            );
                          }
                        };
                        return (
                          <TextField
                            {...propsFromPicker}
                            value={displayValue}
                            onChange={handleDisplayChange}
                            sx={propsFromPicker.sx}
                          />
                        );
                      },
                    }}
                    slotProps={{
                      actionBar: {
                        customOnClose: () => setOpenOneWay(false),
                        customOnReset: () => {
                          setSearchForm((prev) => ({ ...prev, departureDate: initialOneWayDate }));
                          if (!initialOneWayDate) setOneWayStep(1);
                          else setOneWayStep(2);
                        },
                        customOnCancelAndReset: () => {
                          setSearchForm((prev) => ({ ...prev, departureDate: initialOneWayDate }));
                          setOpenOneWay(false);
                          if (!initialOneWayDate) setOneWayStep(1);
                          else setOneWayStep(2);
                        },
                      } as AugmentedActionBarProps,
                      layout: {
                        estimateChecked: searchForm.oneWayDepartureDateEstimate,
                        onEstimateChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          setSearchForm((prev) => ({
                            ...prev,
                            oneWayDepartureDateEstimate: e.target.checked,
                          })),
                      } as any,
                    }}
                    enableAccessibleFieldDOMStructure={false}
                  />
                </LocalizationProvider>
              </Box>
              {oneWayStep >= 2 && (
                <Box
                  sx={{
                    border: highlightOneWayPassengers
                      ? `2px solid ${theme.palette.error.main}`
                      : undefined,
                    borderRadius: 1,
                  }}
                >
                  <TextField
                    placeholder="Passengers"
                    name="passengers"
                    type="text"
                    value={searchForm.passengers}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleDecrementPassengers}
                            size="small"
                            disabled={searchForm.passengers === '-'}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={handleIncrementPassengers}
                            size="small"
                            disabled={searchForm.passengers === '500'}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      inputProps: { min: 1, max: 500 },
                    }}
                    sx={{
                      width: 'auto',
                      minWidth: '150px',
                      maxWidth: '250px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor:
                          searchForm.passengers && searchForm.passengers !== '-'
                            ? '#fdfaf6'
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.23)'
                                : 'rgba(255, 255, 255, 0.23)',
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'transparent !important',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.23)'
                                : 'rgba(255, 255, 255, 0.23)',
                          },
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Return Flight Options */}
          {flightType === 'return' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: theme.spacing(2),
              }}
            >
              <Box
                sx={{
                  cursor: 'pointer',
                  border: highlightReturnDeparture
                    ? `2px solid ${theme.palette.error.main}`
                    : undefined,
                  borderRadius: 1,
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={activeLocale}>
                  <DateTimePicker
                    label="Departure Date"
                    value={searchForm.departureDate}
                    onChange={(newDate) => {
                      setSearchForm((prev) => ({
                        ...prev,
                        departureDate: newDate,
                        returnDate: null,
                      }));
                      if (newDate) setReturnStep(2);
                      else setReturnStep(1);
                    }}
                    minDateTime={new Date()}
                    maxDateTime={addMonths(new Date(), 18)}
                    views={
                      searchForm.returnDepartureDateEstimate
                        ? ['year', 'month']
                        : ['year', 'month', 'day', 'hours', 'minutes']
                    }
                    openTo={searchForm.returnDepartureDateEstimate ? 'month' : 'day'}
                    orientation="landscape"
                    ampm={false}
                    open={openReturnDeparturePicker}
                    onOpen={() => {
                      setOpenReturnDeparturePicker(true);
                      setInitialReturnDepartureDate(searchForm.departureDate);
                    }}
                    onClose={() => setOpenReturnDeparturePicker(false)}
                    slots={{
                      layout: CustomPickerLayout,
                      actionBar: CustomActionBar,
                      toolbar: undefined,
                      textField: (propsFromPicker) => {
                        const originalFormattedValue =
                          typeof propsFromPicker.value === 'string' ? propsFromPicker.value : '';
                        const displayValue = originalFormattedValue.endsWith(' 00:00')
                          ? originalFormattedValue.substring(
                              0,
                              originalFormattedValue.length - ' 00:00'.length
                            ) + ' --:--'
                          : originalFormattedValue;
                        const handleDisplayChange = (
                          event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                        ) => {
                          let textFromInput = event.target.value;
                          if (textFromInput.endsWith(' --:--')) {
                            textFromInput =
                              textFromInput.substring(0, textFromInput.length - ' --:--'.length) +
                              ' 00:00';
                          }
                          const modifiedEvent = {
                            ...event,
                            target: { ...event.target, value: textFromInput },
                          };
                          if (propsFromPicker.onChange) {
                            propsFromPicker.onChange(
                              modifiedEvent as React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            );
                          }
                        };
                        return (
                          <TextField
                            {...propsFromPicker}
                            value={displayValue}
                            onChange={handleDisplayChange}
                            sx={propsFromPicker.sx}
                          />
                        );
                      },
                    }}
                    slotProps={{
                      actionBar: {
                        customOnClose: () => setOpenReturnDeparturePicker(false),
                        customOnReset: () => {
                          setSearchForm((prev) => ({
                            ...prev,
                            departureDate: initialReturnDepartureDate,
                          }));
                          if (!initialReturnDepartureDate) setReturnStep(1);
                          else setReturnStep(2);
                        },
                        customOnCancelAndReset: () => {
                          setSearchForm((prev) => ({
                            ...prev,
                            departureDate: initialReturnDepartureDate,
                          }));
                          setOpenReturnDeparturePicker(false);
                          if (!initialReturnDepartureDate) setReturnStep(1);
                          else setReturnStep(2);
                        },
                      } as AugmentedActionBarProps,
                      layout: {
                        estimateChecked: searchForm.returnDepartureDateEstimate,
                        onEstimateChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          setSearchForm((prev) => ({
                            ...prev,
                            returnDepartureDateEstimate: e.target.checked,
                          })),
                      } as any,
                    }}
                    enableAccessibleFieldDOMStructure={false}
                  />
                </LocalizationProvider>
              </Box>

              {/* Return Date - Appears after Departure Date is selected */}
              {returnStep >= 2 && searchForm.departureDate && (
                <Box
                  sx={{
                    cursor: 'pointer',
                    border: highlightReturnReturn
                      ? `2px solid ${theme.palette.error.main}`
                      : undefined,
                    borderRadius: 1,
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={activeLocale}>
                    <DateTimePicker
                      label="Return Date"
                      value={searchForm.returnDate}
                      onChange={(newDate) => {
                        setSearchForm((prev) => ({
                          ...prev,
                          returnDate: newDate,
                          passengers: '-',
                        }));
                        if (newDate) {
                          setReturnStep(3);
                        } else {
                          if (returnStep >= 3) setReturnStep(2);
                        }
                      }}
                      minDateTime={searchForm.departureDate || new Date()}
                      maxDateTime={addMonths(new Date(), 18)}
                      views={
                        searchForm.returnReturnDateEstimate
                          ? ['year', 'month']
                          : ['year', 'month', 'day', 'hours', 'minutes']
                      }
                      openTo={searchForm.returnReturnDateEstimate ? 'month' : 'day'}
                      orientation="landscape"
                      ampm={false}
                      open={openReturnReturnPicker}
                      onOpen={() => {
                        setOpenReturnReturnPicker(true);
                        setInitialReturnReturnDate(searchForm.returnDate);
                      }}
                      onClose={() => setOpenReturnReturnPicker(false)}
                      slots={{
                        layout: CustomPickerLayout,
                        actionBar: CustomActionBar,
                        toolbar: undefined,
                        textField: (propsFromPicker) => {
                          const originalFormattedValue =
                            typeof propsFromPicker.value === 'string' ? propsFromPicker.value : '';
                          const displayValue = originalFormattedValue.endsWith(' 00:00')
                            ? originalFormattedValue.substring(
                                0,
                                originalFormattedValue.length - ' 00:00'.length
                              ) + ' --:--'
                            : originalFormattedValue;
                          const handleDisplayChange = (
                            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                          ) => {
                            let textFromInput = event.target.value;
                            if (textFromInput.endsWith(' --:--')) {
                              textFromInput =
                                textFromInput.substring(0, textFromInput.length - ' --:--'.length) +
                                ' 00:00';
                            }
                            const modifiedEvent = {
                              ...event,
                              target: { ...event.target, value: textFromInput },
                            };
                            if (propsFromPicker.onChange) {
                              propsFromPicker.onChange(
                                modifiedEvent as React.ChangeEvent<
                                  HTMLInputElement | HTMLTextAreaElement
                                >
                              );
                            }
                          };
                          return (
                            <TextField
                              {...propsFromPicker}
                              value={displayValue}
                              onChange={handleDisplayChange}
                              sx={propsFromPicker.sx}
                            />
                          );
                        },
                      }}
                      slotProps={{
                        actionBar: {
                          customOnClose: () => setOpenReturnReturnPicker(false),
                          customOnReset: () => {
                            setSearchForm((prev) => ({
                              ...prev,
                              returnDate: initialReturnReturnDate,
                            }));
                            if (!initialReturnReturnDate && returnStep >= 3) setReturnStep(2);
                            else if (initialReturnReturnDate && returnStep >= 3) setReturnStep(3);
                          },
                          customOnCancelAndReset: () => {
                            setSearchForm((prev) => ({
                              ...prev,
                              returnDate: initialReturnReturnDate,
                            }));
                            setOpenReturnReturnPicker(false);
                            if (!initialReturnReturnDate && returnStep >= 3) setReturnStep(2);
                            else if (initialReturnReturnDate && returnStep >= 3) setReturnStep(3);
                          },
                        } as AugmentedActionBarProps,
                        layout: {
                          estimateChecked: searchForm.returnReturnDateEstimate,
                          onEstimateChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchForm((prev) => ({
                              ...prev,
                              returnReturnDateEstimate: e.target.checked,
                            })),
                        } as any,
                      }}
                      enableAccessibleFieldDOMStructure={false}
                      disabled={!searchForm.departureDate}
                    />
                  </LocalizationProvider>
                </Box>
              )}

              {/* Passengers - Appears after Return Date is selected */}
              {returnStep >= 3 && searchForm.departureDate && searchForm.returnDate && (
                <Box
                  sx={{
                    border: highlightReturnPassengers
                      ? `2px solid ${theme.palette.error.main}`
                      : undefined,
                    borderRadius: 1,
                  }}
                >
                  <TextField
                    placeholder="Passengers"
                    name="passengers"
                    type="text"
                    value={searchForm.passengers}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleIncrementPassengers}
                            size="small"
                            disabled={searchForm.passengers === '500'}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={handleDecrementPassengers}
                            size="small"
                            disabled={searchForm.passengers === '-'}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      inputProps: { min: 1, max: 500 },
                    }}
                    sx={{
                      width: 'auto',
                      minWidth: '150px',
                      maxWidth: '250px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor:
                          searchForm.passengers && searchForm.passengers !== '-'
                            ? '#fdfaf6'
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.23)'
                                : 'rgba(255, 255, 255, 0.23)',
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'transparent !important',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.23)'
                                : 'rgba(255, 255, 255, 0.23)',
                          },
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Remaining Return Flow: Submit Button (not date picker) */}
          {flightType === 'return' && (
            <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Return Date Picker has been moved inline above */}
              {returnStep >= 4 &&
                searchForm.departureDate &&
                searchForm.returnDate &&
                searchForm.passengers &&
                searchForm.passengers !== '-' && (
                  <Box sx={{ width: '100%', mt: 3 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ py: 1.2 }}
                    >
                      Submit request
                    </Button>
                  </Box>
                )}
            </Box>
          )}

          {/* One-Way Submit Button */}
          {flightType === 'one-way' && oneWayStep >= 3 && (
            <Box sx={{ width: '100%', mt: 3 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ py: 1.2 }}
              >
                Submit request
              </Button>
            </Box>
          )}

          {/* Multi-city UI */}
          {flightType === 'multicity' && (
            <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Map through each leg and render its fields */}
              {searchForm.multiCityLegs.map(
                (leg, legIndex) =>
                  legIndex > 0 && (
                    <Box
                      key={`leg-${legIndex}`}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        gap: theme.spacing(2),
                        p: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      {legIndex > 0 && (
                        <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>
                          Flight {legIndex + 1}
                        </Typography>
                      )}

                      {/* From/To fields only for additional legs */}
                      {legIndex > 0 && (
                        <>
                          <Autocomplete
                            freeSolo
                            options={airportOptions}
                            getOptionLabel={(option: any) =>
                              typeof option === 'string'
                                ? option
                                : `${option.name} (${option.iata})`
                            }
                            value={airportOptions.find((a: any) => a.iata === leg.from) || null}
                            onChange={(_, value: any) => {
                              const newVal = typeof value === 'string' ? value : value?.iata || '';
                              handleMultiCityLegChange(legIndex, 'from', newVal);
                            }}
                            onInputChange={(_, inputValue, reason) => {
                              if (reason === 'input') {
                                handleMultiCityLegChange(legIndex, 'from', inputValue);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                name={`multi-from-${legIndex}`}
                                required
                                placeholder="From"
                                variant="outlined"
                                size="medium"
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <FlightTakeoffIcon color="action" />
                                      </InputAdornment>
                                      {params.InputProps?.startAdornment}
                                    </>
                                  ),
                                }}
                                sx={{
                                  flex: '1 1 150px',
                                  minWidth: 120,
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: leg.from ? '#fdfaf6' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: theme.palette.action.hover,
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor:
                                          theme.palette.mode === 'light'
                                            ? 'rgba(0, 0, 0, 0.23)'
                                            : 'rgba(255, 255, 255, 0.23)',
                                      },
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: 'transparent !important',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor:
                                          theme.palette.mode === 'light'
                                            ? 'rgba(0, 0, 0, 0.23)'
                                            : 'rgba(255, 255, 255, 0.23)',
                                      },
                                    },
                                  },
                                }}
                              />
                            )}
                            sx={{ flex: '1 1 150px', minWidth: 120 }}
                          />

                          <Autocomplete
                            freeSolo
                            options={airportOptions}
                            getOptionLabel={(option: any) =>
                              typeof option === 'string'
                                ? option
                                : `${option.name} (${option.iata})`
                            }
                            value={airportOptions.find((a: any) => a.iata === leg.to) || null}
                            onChange={(_, value: any) => {
                              const newVal = typeof value === 'string' ? value : value?.iata || '';
                              handleMultiCityLegChange(legIndex, 'to', newVal);
                            }}
                            onInputChange={(_, inputValue, reason) => {
                              if (reason === 'input') {
                                handleMultiCityLegChange(legIndex, 'to', inputValue);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                name={`multi-to-${legIndex}`}
                                required
                                placeholder="To"
                                variant="outlined"
                                size="medium"
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <FlightLandIcon color="action" />
                                      </InputAdornment>
                                      {params.InputProps?.startAdornment}
                                    </>
                                  ),
                                }}
                                sx={{
                                  flex: '1 1 150px',
                                  minWidth: 120,
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: leg.to ? '#fdfaf6' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: theme.palette.action.hover,
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor:
                                          theme.palette.mode === 'light'
                                            ? 'rgba(0, 0, 0, 0.23)'
                                            : 'rgba(255, 255, 255, 0.23)',
                                      },
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: 'transparent !important',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor:
                                          theme.palette.mode === 'light'
                                            ? 'rgba(0, 0, 0, 0.23)'
                                            : 'rgba(255, 255, 255, 0.23)',
                                      },
                                    },
                                  },
                                }}
                              />
                            )}
                            sx={{ flex: '1 1 150px', minWidth: 120 }}
                          />
                        </>
                      )}

                      {/* Departure Date field for leg 0 uses global From/To, for others use leg.from/leg.to */}
                      {((legIndex === 0 && searchForm.from && searchForm.to) ||
                        (legIndex > 0 && leg.from && leg.to)) && (
                        <Box
                          sx={{
                            cursor: 'pointer',
                            flex: '1 1 150px',
                            minWidth: 150,
                            border: highlightMultiDate
                              ? `2px solid ${theme.palette.error.main}`
                              : undefined,
                            borderRadius: 1,
                          }}
                        >
                          <LocalizationProvider
                            dateAdapter={AdapterDateFns}
                            adapterLocale={activeLocale}
                          >
                            <DateTimePicker
                              label="Departure Date"
                              value={leg.departureDate}
                              onChange={(newDate) => {
                                handleMultiCityLegChange(legIndex, 'departureDate', newDate);
                                if (newDate) {
                                  if (!completedLegs.includes(legIndex)) {
                                    setMultiCityStep(Math.max(multiCityStep, 2));
                                  }
                                } else {
                                  // If date is cleared, update step if needed
                                  const isAnyLegComplete = searchForm.multiCityLegs.some(
                                    (l, idx) =>
                                      idx !== legIndex && l.from && l.to && l.departureDate
                                  );
                                  if (!isAnyLegComplete) {
                                    setMultiCityStep(1);
                                  }
                                }
                              }}
                              minDateTime={new Date()}
                              maxDateTime={addMonths(new Date(), 18)}
                              views={
                                leg.departureDateEstimate
                                  ? ['year', 'month']
                                  : ['year', 'month', 'day', 'hours', 'minutes']
                              }
                              openTo={leg.departureDateEstimate ? 'month' : 'day'}
                              orientation="landscape"
                              ampm={false}
                              open={openMultiCityPickers[legIndex]}
                              onOpen={() => handleOpenMultiCityPicker(legIndex)}
                              onClose={() => handleCloseMultiCityPicker(legIndex)}
                              slots={{
                                layout: CustomPickerLayout,
                                actionBar: CustomActionBar,
                                toolbar: undefined,
                                textField: (propsFromPicker) => {
                                  const originalFormattedValue =
                                    typeof propsFromPicker.value === 'string'
                                      ? propsFromPicker.value
                                      : '';
                                  const displayValue = originalFormattedValue.endsWith(' 00:00')
                                    ? originalFormattedValue.substring(
                                        0,
                                        originalFormattedValue.length - ' 00:00'.length
                                      ) + ' --:--'
                                    : originalFormattedValue;
                                  const handleDisplayChange = (
                                    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                                  ) => {
                                    let textFromInput = event.target.value;
                                    if (textFromInput.endsWith(' --:--')) {
                                      textFromInput =
                                        textFromInput.substring(
                                          0,
                                          textFromInput.length - ' --:--'.length
                                        ) + ' 00:00';
                                    }
                                    const modifiedEvent = {
                                      ...event,
                                      target: { ...event.target, value: textFromInput },
                                    };
                                    if (propsFromPicker.onChange) {
                                      propsFromPicker.onChange(
                                        modifiedEvent as React.ChangeEvent<
                                          HTMLInputElement | HTMLTextAreaElement
                                        >
                                      );
                                    }
                                  };
                                  return (
                                    <TextField
                                      {...propsFromPicker}
                                      value={displayValue}
                                      onChange={handleDisplayChange}
                                      sx={propsFromPicker.sx}
                                    />
                                  );
                                },
                              }}
                              slotProps={{
                                actionBar: {
                                  customOnClose: () => handleCloseMultiCityPicker(legIndex),
                                  customOnReset: () => {
                                    handleMultiCityLegChange(
                                      legIndex,
                                      'departureDate',
                                      initialMultiCityDates[legIndex]
                                    );
                                    if (!initialMultiCityDates[legIndex]) {
                                      // If date is cleared, update step if needed
                                      const isAnyLegComplete = searchForm.multiCityLegs.some(
                                        (l, idx) =>
                                          idx !== legIndex && l.from && l.to && l.departureDate
                                      );
                                      if (!isAnyLegComplete) {
                                        setMultiCityStep(1);
                                      }
                                    }
                                  },
                                  customOnCancelAndReset: () => {
                                    handleMultiCityLegChange(
                                      legIndex,
                                      'departureDate',
                                      initialMultiCityDates[legIndex]
                                    );
                                    handleCloseMultiCityPicker(legIndex);
                                    if (!initialMultiCityDates[legIndex]) {
                                      // If date is cleared, update step if needed
                                      const isAnyLegComplete = searchForm.multiCityLegs.some(
                                        (l, idx) =>
                                          idx !== legIndex && l.from && l.to && l.departureDate
                                      );
                                      if (!isAnyLegComplete) {
                                        setMultiCityStep(1);
                                      }
                                    }
                                  },
                                } as AugmentedActionBarProps,
                                layout: {
                                  estimateChecked: leg.departureDateEstimate,
                                  onEstimateChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleMultiCityLegChange(
                                      legIndex,
                                      'departureDateEstimate',
                                      e.target.checked
                                    ),
                                } as any,
                              }}
                              enableAccessibleFieldDOMStructure={false}
                            />
                          </LocalizationProvider>
                        </Box>
                      )}
                    </Box>
                  )
              )}

              {/* Submit button - shown when at least one leg is complete and passengers are filled */}
              {searchForm.multiCityLegs.some((leg) => leg.from && leg.to && leg.departureDate) &&
                searchForm.passengers &&
                searchForm.passengers !== '-' && (
                  <Box sx={{ width: '100%', mt: 3 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ py: 1.2 }}
                    >
                      Submit request
                    </Button>
                  </Box>
                )}
            </Box>
          )}

          {/* Flight Type Radio Buttons - Moved to bottom of card */}
          {searchForm.from && searchForm.to && (
            <Box
              sx={{
                width: '100%',
                mt: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: theme.spacing(2),
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: highlightFlightType ? `2px solid ${theme.palette.error.main}` : undefined,
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <FormControl
                  component="fieldset"
                  sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <RadioGroup
                    row
                    name="flightType"
                    value={flightType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFlightType(e.target.value as any);
                      resetDependentFields('flightType');
                    }}
                  >
                    <FormControlLabel
                      value="one-way"
                      label="One-way"
                      labelPlacement="bottom"
                      control={
                        <Radio
                          icon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ArrowForwardIcon color="action" />
                            </Box>
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: 'primary.main',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fdfaf6',
                              }}
                            >
                              <ArrowForwardIcon color="primary" />
                            </Box>
                          }
                        />
                      }
                    />
                    <FormControlLabel
                      value="return"
                      label="Return"
                      labelPlacement="bottom"
                      control={
                        <Radio
                          icon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <SwapHorizIcon color="action" />
                            </Box>
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: 'primary.main',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fdfaf6',
                              }}
                            >
                              <SwapHorizIcon color="primary" />
                            </Box>
                          }
                        />
                      }
                    />
                    <FormControlLabel
                      value="multicity"
                      label="Multi-city"
                      labelPlacement="bottom"
                      control={
                        <Radio
                          icon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MultipleStopIcon color="action" />
                            </Box>
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: 'primary.main',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fdfaf6',
                              }}
                            >
                              <MultipleStopIcon color="primary" />
                            </Box>
                          }
                        />
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Add Leg button - new position, right-aligned */}
              {flightType === 'multicity' &&
                multiCityStep === 4 &&
                searchForm.passengers &&
                searchForm.passengers !== '-' &&
                searchForm.multiCityLegs.length < 4 && (
                  <Button
                    variant="outlined"
                    onClick={handleAddLeg}
                    startIcon={<AddIcon />}
                    sx={{ alignSelf: 'center' }}
                  >
                    Add Flight
                  </Button>
                )}
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={twinEngineMin}
                    onChange={(e) => setTwinEngineMin(e.target.checked)}
                  />
                }
                label="Twin engine minimum"
                sx={{ alignSelf: 'center' }}
              />
            </Box>
          )}

          {/* After the passenger count field, add the extras accordion */}
          {searchForm.from && searchForm.to && flightType && (
            <Box
              sx={{
                width: '100%',
                mt: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  borderColor: theme.palette.divider,
                  boxShadow: 'none',
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Additional Options
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasFlexibleTimes}
                        onChange={(e) => setHasFlexibleTimes(e.target.checked)}
                      />
                    }
                    label="Flexible Times"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasFlexibleDates}
                        onChange={(e) => setHasFlexibleDates(e.target.checked)}
                      />
                    }
                    label="Flexible Dates"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} />
                    }
                    label="Traveling with Pets"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasExtraBaggage}
                        onChange={(e) => setHasExtraBaggage(e.target.checked)}
                      />
                    }
                    label="Extra Baggage"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasHardBags}
                        onChange={(e) => setHasHardBags(e.target.checked)}
                      />
                    }
                    label="Hard Bags / Equipment"
                  />
                </Box>

                {/* Conditional input fields based on selections */}
                {hasPets && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Pet Details (type, weight, crate dimensions)"
                    value={petDetails}
                    onChange={(e) => setPetDetails(e.target.value)}
                    placeholder="E.g., Small dog, 8kg, traveling in soft carrier"
                    size="small"
                  />
                )}

                {hasExtraBaggage && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Extra Baggage Details (quantity, weight)"
                    value={baggageDetails}
                    onChange={(e) => setBaggageDetails(e.target.value)}
                    placeholder="E.g., 2 extra suitcases, approx. 25kg each"
                    size="small"
                  />
                )}

                {hasHardBags && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Hard Bags / Equipment Details"
                    value={hardBagDetails}
                    onChange={(e) => setHardBagDetails(e.target.value)}
                    placeholder="E.g., Golf clubs, ski equipment, musical instruments"
                    size="small"
                  />
                )}

                <TextField
                  fullWidth
                  margin="normal"
                  label="Additional Requirements"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="Any other special requirements or preferences"
                  multiline
                  rows={2}
                  size="small"
                />
              </Paper>
            </Box>
          )}
        </Paper>

        {/* Operator Modal */}
        <Dialog
          open={operatorModalOpen}
          onClose={() => setOperatorModalOpen(false)}
          aria-labelledby="operator-modal-title"
          aria-describedby="operator-modal-description"
        >
          <DialogTitle id="operator-modal-title">Operator Account Restriction</DialogTitle>
          <DialogContent>
            <DialogContentText id="operator-modal-description">
              Operator accounts cannot request quotes. Please create a passenger account to request
              charter flights.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOperatorModalOpen(false)} color="primary">
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
            >
              Register as Passenger
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </>
  );
}
