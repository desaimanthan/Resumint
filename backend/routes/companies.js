const express = require('express');
const router = express.Router();

// Logo.dev Brand Search API integration
const searchCompanies = async (query) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const logodevApiKey = process.env.LOGODEV_API_KEY;
    if (!logodevApiKey) {
      console.log('Logo.dev API key not found, returning empty results');
      return [];
    }

    console.log(`Making Logo.dev API call for: "${query}"`);

    // Use Logo.dev Brand Search API with correct header format
    const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer: ${logodevApiKey}`
      }
    });

    if (!response.ok) {
      console.log(`Logo.dev API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return [];
    }

    const data = await response.json();
    console.log('Logo.dev API response:', JSON.stringify(data, null, 2));
    
    // Transform Logo.dev response to our format
    // Logo.dev returns an array directly: [{"name":"sweetgreen","domain":"sweetgreen.com","logo_url":"..."}, ...]
    if (data && Array.isArray(data)) {
      return data.slice(0, 10).map((company, index) => ({
        id: company.domain || `company-${index}`,
        name: company.name,
        domain: company.domain,
        logo: company.logo_url || `https://img.logo.dev/${company.domain}?token=${logodevApiKey}&size=64&format=png`,
        industry: 'Technology', // Logo.dev doesn't provide industry info in brand search
        size: estimateCompanySize(company.name)
      }));
    }

    return [];
  } catch (error) {
    console.error('Logo.dev Brand Search error:', error);
    return [];
  }
};

// Helper function to estimate company size
const estimateCompanySize = (companyName) => {
  if (!companyName) return 'Unknown size';
  
  const name = companyName.toLowerCase();
  
  // Large companies (10,000+ employees)
  const largeCompanies = [
    'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook',
    'ibm', 'oracle', 'intel', 'cisco', 'samsung', 'walmart',
    'jpmorgan', 'bank of america', 'wells fargo', 'goldman sachs'
  ];
  
  // Medium companies (1,000-10,000 employees)
  const mediumCompanies = [
    'netflix', 'tesla', 'spotify', 'airbnb', 'uber', 'adobe',
    'salesforce', 'nvidia', 'paypal', 'square', 'zoom', 'slack'
  ];
  
  // Small companies (100-1,000 employees)
  const smallCompanies = [
    'stripe', 'figma', 'notion', 'discord', 'canva', 'dropbox'
  ];

  for (const company of largeCompanies) {
    if (name.includes(company)) return '10,000+ employees';
  }
  
  for (const company of mediumCompanies) {
    if (name.includes(company)) return '1,000-10,000 employees';
  }
  
  for (const company of smallCompanies) {
    if (name.includes(company)) return '100-1,000 employees';
  }
  
  return '50-500 employees';
};

// Search companies endpoint
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    console.log(`Searching companies for: "${q}"`);
    
    const companies = await searchCompanies(q);
    
    console.log(`Found ${companies.length} companies`);
    
    res.json(companies);
  } catch (error) {
    console.error('Company search endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to search companies',
      message: error.message 
    });
  }
});

// Get popular companies (fallback for when no search query)
router.get('/popular', async (req, res) => {
  try {
    // Search for some popular companies to show as defaults
    const popularQueries = ['Google', 'Microsoft', 'Apple', 'Amazon'];
    const allCompanies = [];
    
    for (const query of popularQueries) {
      const companies = await searchCompanies(query);
      allCompanies.push(...companies);
    }
    
    // Remove duplicates and limit to 8
    const uniqueCompanies = allCompanies
      .filter((company, index, self) => 
        index === self.findIndex(c => c.domain === company.domain)
      )
      .slice(0, 8);
    
    res.json(uniqueCompanies);
  } catch (error) {
    console.error('Popular companies endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to get popular companies',
      message: error.message 
    });
  }
});

// Health check for companies API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Companies API is running',
    logodevApiKey: process.env.LOGODEV_API_KEY ? 'Set' : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to directly test Logo.dev API
router.get('/test/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const companies = await searchCompanies(query);
    res.json({
      query,
      results: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      query: req.params.query
    });
  }
});

module.exports = router;
