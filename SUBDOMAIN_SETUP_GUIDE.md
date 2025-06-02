# Subdomain Setup Guide for Local Development

This guide explains how to set up subdomain routing for published resumes in local development.

## Overview

When a resume is published with subdomain "manthan", users should be able to access it via:
- `manthan.localhost:3000` → redirects to `localhost:3000/portfolio/manthan`

## Setup Steps

### 1. Hosts File Configuration

Add subdomain entries to your hosts file for each published resume:

```bash
# Add to /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 manthan.localhost
127.0.0.1 john.localhost
127.0.0.1 jane.localhost
# Add more as needed for each published subdomain
```

**For macOS/Linux:**
```bash
echo "127.0.0.1 manthan.localhost" | sudo tee -a /etc/hosts
```

**For Windows (run as Administrator):**
```cmd
echo 127.0.0.1 manthan.localhost >> C:\Windows\System32\drivers\etc\hosts
```

### 2. Next.js Middleware

The `frontend/middleware.ts` file handles subdomain detection and routing:

- Detects when a request comes from a subdomain (e.g., `manthan.localhost:3000`)
- Rewrites the URL to `/portfolio/[subdomain]` internally
- Preserves the subdomain URL in the browser

### 3. Testing the Setup

1. **Start the development server:**
   ```bash
   cd frontend && npm run dev
   ```

2. **Publish a resume** with subdomain "manthan"

3. **Test the subdomain URL:**
   - Visit `http://manthan.localhost:3000`
   - Should display the same content as `http://localhost:3000/portfolio/manthan`

### 4. Adding New Subdomains

When users publish resumes with new subdomains, you need to:

1. **Add to hosts file:**
   ```bash
   echo "127.0.0.1 newsubdomain.localhost" | sudo tee -a /etc/hosts
   ```

2. **Restart your browser** (to clear DNS cache)

3. **Test the new subdomain URL**

## How It Works

### Middleware Logic

```typescript
// Extract subdomain from hostname
const parts = hostname.split('.')

// Check if this is a subdomain
if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
  const subdomain = parts[0]
  
  // Rewrite to portfolio route
  url.pathname = `/portfolio/${subdomain}`
  return NextResponse.rewrite(url)
}
```

### URL Rewriting vs Redirecting

- **Rewrite**: Internal routing, URL stays the same in browser
- **Redirect**: Browser URL changes to the new URL

We use **rewrite** to maintain the clean subdomain URL while serving the portfolio content.

## Production Deployment

For production, you'll need:

1. **Wildcard DNS**: Configure `*.yourdomain.com` to point to your server
2. **SSL Certificate**: Wildcard SSL for `*.yourdomain.com`
3. **Server Configuration**: Nginx/Apache to handle subdomain routing

## Troubleshooting

### Subdomain Not Working

1. **Check hosts file:**
   ```bash
   cat /etc/hosts | grep localhost
   ```

2. **Clear browser cache and DNS:**
   - Chrome: `chrome://net-internals/#dns` → Clear host cache
   - Firefox: Restart browser
   - Safari: Restart browser

3. **Verify middleware:**
   - Check `frontend/middleware.ts` exists
   - Restart Next.js dev server

### Port Issues

If using a different port, update hosts file accordingly:
```bash
127.0.0.1 manthan.localhost
# Then access via: http://manthan.localhost:3001
```

## Security Notes

- Hosts file changes only affect your local machine
- In production, use proper DNS configuration
- Consider rate limiting for subdomain creation
- Validate subdomain names to prevent abuse

## Example Workflow

1. User publishes resume with subdomain "johndoe"
2. Add `127.0.0.1 johndoe.localhost` to hosts file
3. Visit `http://johndoe.localhost:3000`
4. Middleware detects "johndoe" subdomain
5. Internally serves `/portfolio/johndoe` content
6. User sees clean subdomain URL
