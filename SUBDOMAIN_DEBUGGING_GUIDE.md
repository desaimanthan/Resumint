# Subdomain Debugging Guide

## 🔍 **Current Status**

- ✅ `https://www.resumint.site/portfolio/chirag` → Works (portfolio loads)
- ❌ `https://chirag.resumint.site/` → Shows "resume not found"

This suggests the middleware is working (routing the subdomain) but there might be an issue with the subdomain parameter extraction.

## 🛠️ **Debugging Steps**

### **Step 1: Check Vercel Function Logs**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `resumint`
3. **Click on "Functions" tab**
4. **Look for middleware logs** when you visit `https://chirag.resumint.site/`

### **Expected Logs:**
```
🔍 Middleware triggered:
  - Hostname: chirag.resumint.site
  - Pathname: /
  - Full URL: https://chirag.resumint.site/
  - Hostname without port: chirag.resumint.site
  - Hostname parts: ['chirag', 'resumint', 'site']
  🎯 Subdomain detected: chirag
  🔍 Full hostname parts: ['chirag', 'resumint', 'site']
  📍 isLocalSubdomain: false
  📍 isVercelSubdomain: false
  📍 isCustomDomainSubdomain: true
  🔄 Rewriting to: /portfolio/chirag
```

### **Step 2: Test API Directly**

Open browser console and test the API call:

```javascript
fetch('https://resumint-backend.vercel.app/api/published/chirag')
  .then(response => response.json())
  .then(data => console.log(data))
```

**Expected Result:**
- If portfolio exists: `{ success: true, data: { resume: {...} } }`
- If not found: `{ success: false, message: "Resume not found" }`

### **Step 3: Compare Working vs Non-Working**

**Working URL:** `https://www.resumint.site/portfolio/chirag`
- Direct route to `/portfolio/[subdomain]` page
- `useParams()` gets `{ subdomain: 'chirag' }`
- API call: `/published/chirag`

**Non-Working URL:** `https://chirag.resumint.site/`
- Middleware rewrites to `/portfolio/chirag`
- Should route to same `/portfolio/[subdomain]` page
- `useParams()` should get `{ subdomain: 'chirag' }`
- API call: `/published/chirag`

## 🔧 **Possible Issues**

### **Issue 1: Middleware Not Triggering**
- Check if logs appear in Vercel Functions
- Verify custom domain is properly configured

### **Issue 2: Wrong Subdomain Extraction**
- Check if `subdomain` parameter is correct in logs
- Verify hostname parsing logic

### **Issue 3: API Environment Variable**
- Portfolio page might be calling wrong API URL
- Check `NEXT_PUBLIC_API_URL` in production

### **Issue 4: Database Issue**
- Portfolio might not exist with subdomain "chirag"
- Check if subdomain is case-sensitive

## 🧪 **Quick Tests**

### **Test 1: Check Middleware Logs**
1. Visit `https://chirag.resumint.site/`
2. Check Vercel Functions logs immediately
3. Look for middleware console logs

### **Test 2: Test Different Subdomain**
1. Try `https://test.resumint.site/`
2. Should show same "resume not found" if middleware works
3. Different error if middleware doesn't work

### **Test 3: Check API Response**
```bash
curl https://resumint-backend.vercel.app/api/published/chirag
```

## 📋 **What to Look For**

### **If Middleware Logs Don't Appear:**
- Custom domain not properly configured
- DNS not pointing to Vercel
- Middleware not deployed

### **If Middleware Logs Show Wrong Subdomain:**
- Hostname parsing issue
- Need to fix subdomain extraction logic

### **If API Returns 404:**
- Portfolio doesn't exist in database
- Subdomain mismatch in database

### **If API Returns Different Error:**
- Backend connectivity issue
- Environment variable problem

## 🎯 **Next Steps Based on Results**

### **If Middleware Not Working:**
- Check Vercel domain configuration
- Verify DNS settings
- Redeploy middleware

### **If Subdomain Wrong:**
- Fix hostname parsing logic
- Update middleware subdomain extraction

### **If API Issue:**
- Check backend deployment
- Verify database has portfolio with subdomain "chirag"
- Check environment variables

## 📞 **Report Back**

Please check the Vercel function logs and let me know:

1. **Do you see middleware logs** when visiting `https://chirag.resumint.site/`?
2. **What subdomain is detected** in the logs?
3. **What does the API return** when called directly?

This will help pinpoint the exact issue! 🔍
