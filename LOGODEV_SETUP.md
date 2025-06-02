# Logo.dev API Setup Guide

This guide explains how to set up Logo.dev API for company logos in the Resume Builder.

## What is Logo.dev?

Logo.dev is the modern replacement for the deprecated Clearbit Logo API. It provides high-quality company logos with better reliability and performance.

## Setup Instructions

### 1. Get a Free API Key (Optional but Recommended)

1. Visit [logo.dev](https://www.logo.dev)
2. Sign up for a free account
3. Get your API key from the dashboard
4. The free tier provides enough requests for most projects

### 2. Add API Key to Environment Variables

Add your Logo.dev API key to your `.env` file:

```bash
# Logo.dev API Key (optional - works without but with rate limits)
LOGODEV_API_KEY=your_logo_dev_api_key_here
```

### 3. Restart the Backend Server

After adding the API key, restart your backend server:

```bash
cd backend
npm start
```

## How It Works

### With API Key
- **High rate limits**: Suitable for production use
- **High-quality logos**: 64x64px PNG format
- **Fast performance**: Optimized delivery
- **Reliable service**: Professional-grade API

### Without API Key (Free Tier)
- **Limited requests**: Good for testing and development
- **Rate limiting**: May show placeholder letters instead of logos
- **Still functional**: All features work, just with limits

## API Usage

The system automatically uses Logo.dev for company logos:

```javascript
// Backend generates logo URLs like this:
const logoUrl = `https://img.logo.dev/${company.domain}?token=${process.env.LOGODEV_API_KEY}&size=64&format=png`

// Examples:
// https://img.logo.dev/google.com?token=YOUR_KEY&size=64&format=png
// https://img.logo.dev/microsoft.com?token=YOUR_KEY&size=64&format=png
```

## Attribution Requirement

**Important**: Logo.dev requires attribution when using their free service.

The attribution link is automatically included in the Resume Builder footer:

```html
<a href="https://logo.dev" alt="Logo API">Logos provided by Logo.dev</a>
```

## Features

### Logo Formats
- **PNG**: High-quality with transparency
- **SVG**: Vector format for perfect scaling
- **WebP**: Modern format for better compression

### Sizes Available
- **32x32**: Small icons
- **64x64**: Standard size (used in Resume Builder)
- **128x128**: Large icons
- **256x256**: High-resolution

### Fallback Handling
- **Automatic fallback**: Shows building icon if logo fails
- **Error resilience**: Graceful handling of missing logos
- **Consistent experience**: Always shows something meaningful

## Rate Limits

### Free Tier (No API Key)
- **Limited requests per hour**
- **Good for testing and development**
- **May show placeholder letters when limit exceeded**

### Paid Tier (With API Key)
- **High rate limits**
- **Suitable for production**
- **Consistent logo delivery**
- **Priority support**

## Troubleshooting

### Logos Not Showing
1. **Check API key**: Ensure `LOGODEV_API_KEY` is set correctly
2. **Rate limits**: You may have exceeded free tier limits
3. **Domain format**: Ensure company domains are correct (e.g., "google.com" not "www.google.com")
4. **Network issues**: Check if Logo.dev is accessible

### Placeholder Letters Showing
- **Rate limit exceeded**: Wait or upgrade to paid tier
- **Invalid domain**: Check if the company domain is correct
- **API key missing**: Add your API key to environment variables

### Performance Issues
- **Use API key**: Significantly improves performance
- **Cache logos**: Browser automatically caches logo images
- **Optimize requests**: System already includes debouncing

## Migration from Clearbit

If you were previously using Clearbit Logo API:

1. **Replace URLs**: Change from `logo.clearbit.com` to `img.logo.dev`
2. **Add API key**: Logo.dev requires authentication for production use
3. **Update attribution**: Change attribution from Clearbit to Logo.dev
4. **Test thoroughly**: Verify all logos load correctly

## Support

- **Documentation**: [docs.logo.dev](https://docs.logo.dev)
- **Support**: [team@logo.dev](mailto:team@logo.dev)
- **Status**: [status.logo.dev](https://status.logo.dev)

## Cost

- **Free tier**: Perfect for testing and small projects
- **Paid tiers**: Affordable pricing for production use
- **No hidden fees**: Transparent pricing model
- **Cancel anytime**: No long-term commitments

The Resume Builder is designed to work seamlessly with or without an API key, ensuring a great experience regardless of your Logo.dev plan.
