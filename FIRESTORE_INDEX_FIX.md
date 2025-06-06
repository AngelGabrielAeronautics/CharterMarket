# Firestore Composite Index Fix

## Issue Description 🔍

**Error**: `GET /api/bookings?clientId=PA-PAX-XSOX 500 (Internal Server Error)`

**Root Cause**: When using Firestore queries with both `where()` and `orderBy()` clauses on different fields, Firebase requires a composite index to be created manually.

**Specific Query**: 
```javascript
query(
  collection(db, 'bookings'),
  where('clientId', '==', clientId),
  orderBy('createdAt', 'desc')
)
```

## Quick Fix Steps ⚡

### Option 1: Create Composite Index (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: Charter
3. **Navigate to Firestore Database** → **Indexes** → **Composite**
4. **Click "Create Index"**
5. **Configure the index**:
   - **Collection ID**: `bookings`
   - **Field 1**: `clientId` (Ascending)
   - **Field 2**: `createdAt` (Descending)
   - **Query Scope**: Collection
6. **Click "Create"** and wait for index to build (usually 1-5 minutes)

### Option 2: Use Debug Function (Temporary)

The code already includes a temporary fix that:
1. Tries to fetch without `orderBy` first
2. Sorts results manually in JavaScript
3. Falls back to the regular function if needed

## Expected Indexes Needed 📋

For full functionality, create these composite indexes:

### 1. Bookings by Client
- **Collection**: `bookings`
- **Fields**: `clientId` (Ascending), `createdAt` (Descending)

### 2. Bookings by Operator  
- **Collection**: `bookings` 
- **Fields**: `operatorId` (Ascending), `createdAt` (Descending)

### 3. Invoices by Booking
- **Collection**: `invoices`
- **Fields**: `bookingId` (Ascending), `createdAt` (Descending)

### 4. Invoices by Client
- **Collection**: `invoices`
- **Fields**: `clientId` (Ascending), `createdAt` (Descending)

## Debugging Tools 🛠️

### 1. Bookings Debug Page
Navigate to: `/dashboard/debug/bookings`

This page allows you to:
- Test API endpoints directly
- Test Firestore queries with/without orderBy
- See detailed error messages
- View raw query results

### 2. Console Error Analysis

When the error occurs, check browser console for detailed logs:

```
getClientBookings called with clientId: PA-PAX-XSOX
Executing Firestore query for client bookings...
Error: The query requires an index...
```

## Firebase Console Index Creation 📖

### Step-by-Step with Screenshots

1. **Access Firebase Console**
   ```
   https://console.firebase.google.com → Select Project
   ```

2. **Navigate to Indexes**
   ```
   Firestore Database → Indexes Tab → Composite Tab
   ```

3. **Create Index Form**
   ```
   Collection ID: bookings
   ```

4. **Add Fields**
   ```
   Field 1: clientId (type: Ascending)
   Field 2: createdAt (type: Descending)  
   ```

5. **Index Status**
   - **Building**: Yellow indicator, wait 1-5 minutes
   - **Ready**: Green indicator, queries will work
   - **Error**: Red indicator, check field names/types

## Alternative Solutions 🔄

### Option A: Remove OrderBy (Quick Fix)
- Modify queries to not use `orderBy`
- Sort results in JavaScript instead
- Trade-off: Slightly slower for large datasets

### Option B: Use Cursor Pagination
- Implement cursor-based pagination
- Reduces need for complex indexes
- Better for large datasets

### Option C: Restructure Data
- Add computed fields for common queries
- Use subcollections for better query patterns
- More complex but more scalable

## Testing the Fix ✅

After creating indexes:

1. **Wait for index to build** (check Firebase Console)
2. **Test the API endpoint**:
   ```bash
   curl "http://localhost:3000/api/bookings?clientId=PA-PAX-XSOX"
   ```
3. **Check console logs** for success messages
4. **Verify data returns correctly**

## Prevention for Future 🚀

### Code Patterns to Avoid

❌ **Bad**: Query with multiple conditions without index
```javascript
query(collection(db, 'bookings'), 
  where('status', '==', 'pending'),
  where('clientId', '==', clientId),
  orderBy('createdAt', 'desc')
)
```

✅ **Good**: Plan indexes when writing queries
```javascript
// Document this requires index: status + clientId + createdAt
query(collection(db, 'bookings'), 
  where('status', '==', 'pending'),
  where('clientId', '==', clientId),
  orderBy('createdAt', 'desc')
)
```

### Development Workflow

1. **Write query** in development
2. **Test locally** with Firebase emulator
3. **Note index requirements** in code comments
4. **Create indexes** before deploying to production
5. **Document required indexes** in project README

## Error Messages Reference 📚

### Common Firestore Index Errors

| Error Message | Solution |
|---------------|----------|
| "requires an index" | Create composite index |
| "inequality filter property" | Reorder query conditions |
| "can only be performed on a single property" | Use array-contains or restructure |
| "permission denied" | Check Firestore rules |

### Quick Diagnosis

```javascript
// Add this to quickly identify index issues
const testQuery = async () => {
  try {
    await getDocs(yourQuery);
    console.log('✅ Query works - index exists');
  } catch (error) {
    if (error.message.includes('index')) {
      console.log('❌ Index required:', error.message);
    } else {
      console.log('❌ Other error:', error.message);
    }
  }
};
```

---

## Status: 🔧 **ACTION REQUIRED**

**Next Step**: Create the composite indexes in Firebase Console as described above.

**ETA**: 5-10 minutes to create indexes + 1-5 minutes for Firebase to build them.

**Impact**: Will resolve all 500 errors when fetching bookings by client/operator ID. 