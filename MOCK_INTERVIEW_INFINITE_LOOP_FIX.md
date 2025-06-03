# Mock Interview Infinite Loop Fix

## Issue Description
The mock interview pages were experiencing infinite API call loops, causing thousands of requests to be made continuously. This was happening on both the setup page (`/mock-interview/[id]/setup`) and interview page (`/mock-interview/[id]/interview`).

## Root Cause
The issue was caused by improper dependency arrays in the `useEffect` hooks. The hooks were including `apiCall`, `toast`, and `router` functions as dependencies, which are recreated on every render, causing the effect to run infinitely.

```javascript
// PROBLEMATIC CODE:
useEffect(() => {
  // fetch data logic
}, [interviewId, apiCall, toast, router]) // These functions change on every render!
```

## Solution
Fixed by removing the function dependencies and only keeping the stable `interviewId` parameter:

```javascript
// FIXED CODE:
useEffect(() => {
  // fetch data logic
}, [interviewId]) // Only depend on interviewId
```

## Files Modified

### 1. frontend/src/app/mock-interview/[id]/interview/page.tsx
- **Line 95**: Fixed useEffect dependency array
- **Before**: `}, [interviewId, apiCall, toast, router])`
- **After**: `}, [interviewId]) // Only depend on interviewId`

### 2. frontend/src/app/mock-interview/[id]/setup/page.tsx
- **Line 95**: Fixed useEffect dependency array  
- **Before**: `}, [interviewId, apiCall, toast, router])`
- **After**: `}, [interviewId]) // Only depend on interviewId`

### 3. frontend/src/app/mock-interview/[id]/report/page.tsx
- **Line 75**: Fixed useEffect dependency array
- **Before**: `}, [interviewId, apiCall, toast, router])`
- **After**: `}, [interviewId]) // Only depend on interviewId`

## Why This Fix Works

1. **Stable Dependencies**: `interviewId` comes from URL params and doesn't change unless the user navigates to a different interview
2. **Function Stability**: `apiCall`, `toast`, and `router` are recreated on every render in React, causing infinite loops when used as dependencies
3. **ESLint Warning**: While ESLint may warn about missing dependencies, this is a known pattern for avoiding infinite loops with stable function references

## Impact
- ✅ Eliminates infinite API calls
- ✅ Reduces server load and prevents potential rate limiting
- ✅ Improves page performance and user experience
- ✅ Prevents unnecessary Claude API costs from repeated calls

## Testing
After applying this fix:
1. Navigate to `/mock-interview/[id]/setup` - should make only 2 API calls (interview + resumes)
2. Navigate to `/mock-interview/[id]/interview` - should make only 1 API call (interview)
3. No continuous API calls should appear in browser network tab or server logs

## Alternative Solutions Considered
1. **useCallback/useMemo**: Would require wrapping all functions, adding complexity
2. **Custom Hook**: Could extract logic but doesn't solve the fundamental dependency issue
3. **Ref Pattern**: Using useRef to store functions, but unnecessary for this use case

The chosen solution is the simplest and most effective for this specific scenario.
