# Test Data Generation Guide

This guide explains how to generate comprehensive test data for the Charter platform for development and testing purposes.

## 🎯 What Gets Created

The test data generation creates a complete, realistic dataset including:

### 👥 **20 User Accounts**
- **8 Passengers** - Individual travelers 
- **4 Agents/Brokers** - Travel agencies and charter brokers
- **6 Operators** - Aircraft operators with fleets
- **2 Admins** - Platform administrators

### ✈️ **~20 Aircraft**
- Each operator gets 2-5 realistic aircraft
- Includes popular jets: Citation XLS+, Phenom 300E, Challenger 350, G650ER, etc.
- Complete with registration numbers, maintenance records, and documents

### 📋 **30 Quote Requests**
- Realistic routes between major airports (SA, Europe, US)
- Various passenger counts, cabin classes, and preferences
- From both passengers and agents

### 💰 **~60+ Offers**
- 1-3 offers per quote request from different operators
- Realistic pricing with 3% commission
- Response time tracking for analytics

## 🚀 How to Generate Test Data

### Method 1: Command Line (Recommended)

```bash
npm run generate-test-data
```

### Method 2: API Endpoint

If you prefer to use the web interface:

1. Log in as an admin user
2. Navigate to `/api/debug/create-comprehensive-test-data`
3. Make a POST request with your auth token

## 🔐 Login Credentials

All test users have the same password for easy testing:

- **Password**: `TestPassword123!`
- **Sample emails**: 
  - `james.smith0@charter-test.com`
  - `sarah.johnson1@charter-test.com`
  - etc.

## 📊 Data Distribution

The generated data creates realistic relationships:

- **Quote Requests**: Mix of passengers and agents requesting flights
- **Routes**: International and regional routes using real airport codes
- **Aircraft**: Each operator has multiple aircraft with different categories
- **Response Times**: Varied response times for analytics testing
- **Pricing**: Realistic charter pricing with commission structure

## 🗂️ Database Collections

Data is created in these Firestore collections:

- `users` - User accounts with roles and profiles
- `aircraft` - Aircraft fleet data for operators  
- `quoteRequests` - Flight quote requests from clients
- `offers` - Price quotes from operators

## 🧪 Testing Scenarios

With this test data, you can test:

### For Passengers:
- Creating quote requests
- Receiving and comparing offers
- Booking flights
- Managing passenger information

### For Agents/Brokers:
- Managing client requests
- Handling multiple passenger bookings
- Commission tracking

### For Operators:
- Receiving quote requests
- Submitting competitive offers
- Managing aircraft fleet
- Response time performance

### For Admins:
- User management across roles
- Analytics and reporting
- Platform oversight

## 🎨 Realistic Data Features

The generated data includes:

- **Real Airport Codes**: FAJS (Johannesburg), FACT (Cape Town), LFPG (Paris), etc.
- **Actual Aircraft Models**: Citation XLS+, Phenom 300E, Challenger 350, G650ER
- **South African Registrations**: ZS-XXX format
- **Proper User Codes**: PA-SMIT-ABCD (Passenger), OP-JETS-EFGH (Operator)
- **Realistic Pricing**: $10,000-$60,000 range based on aircraft type
- **Response Time Variation**: From minutes to days for analytics

## 🗑️ Cleanup

**Important**: Remember to delete test data when done testing!

The test data includes:
- Firebase Auth users
- Firestore documents
- Custom user claims

You can identify test data by:
- Email domain: `@charter-test.com`
- User codes starting with generated patterns
- Recent creation timestamps

## 🔧 Customization

To modify the test data generation:

1. Edit `scripts/generate-test-data.ts`
2. Adjust the constants:
   - `AIRPORTS` - Available airports
   - `AIRCRAFT_TYPES` - Aircraft models
   - `FIRST_NAMES` / `LAST_NAMES` - User names
   - `COMPANY_NAMES` - Operator companies

3. Modify the generation logic:
   - User count and role distribution
   - Aircraft per operator
   - Quote request patterns
   - Pricing ranges

## 🚨 Prerequisites

- Firebase Admin SDK credentials configured
- Node.js and ts-node installed
- Proper Firestore security rules for testing environment

## 💡 Best Practices

1. **Use in Development Only**: Never run on production data
2. **Clean Environment**: Start with a clean Firestore instance
3. **Regular Cleanup**: Delete test data regularly to avoid clutter
4. **Monitor Costs**: Be aware of Firebase usage during testing
5. **Document Changes**: Update this guide when modifying test data patterns

## 🔗 Related Files

- `scripts/generate-test-data.ts` - Main generation script
- `src/app/api/debug/create-comprehensive-test-data/route.ts` - API endpoint
- `src/components/admin/TestDataGenerator.tsx` - UI component (if needed)

## 📞 Support

If you encounter issues with test data generation:

1. Check Firebase Admin SDK configuration
2. Verify Firestore security rules allow writes
3. Ensure sufficient Firebase quota
4. Check console logs for specific errors

---

**Happy Testing!** 🎉 