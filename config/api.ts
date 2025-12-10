// Environment-specific API configuration
import axios from 'axios';

// Development and production URLs
const LOCALHOST_URL = 'http://127.0.0.1:8000';
const PRODUCTION_URL = 'https://app.ceylonayurvedahealth.co.uk';

// Start with localhost for development, will fallback to production if it fails
// Using 'export let' so it can be updated when switching to production
export let API_BASE_URL = LOCALHOST_URL;

console.log('=== API CONFIG LOADED ===');
console.log('Primary URL (Localhost):', LOCALHOST_URL);
console.log('Fallback URL (Production):', PRODUCTION_URL);
console.log('Starting with:', API_BASE_URL);
console.log('========================');

// You can add more API-related configuration here
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;

// Set default baseURL and timeout for all axios requests
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = API_TIMEOUT;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST ===');
    console.log('BaseURL:', config.baseURL);
    console.log('URL:', config.url);
    console.log('Full URL:', `${config.baseURL}${config.url}`);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Data:', config.data);
    console.log('==================');
    return config;
  },
  (error) => {
    console.log('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and automatic fallback
axios.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    console.log('Data:', response.data);
    console.log('===================');
    return response;
  },
  async (error) => {
    console.log('=== API ERROR ===');
    console.log('Error:', error.message);

    // Check if this is a network error (localhost not available)
    const isNetworkError = !error.response && error.request;
    const isLocalhost = error.config?.baseURL?.includes('127.0.0.1') || error.config?.baseURL?.includes('localhost');

    if (isNetworkError && isLocalhost && !error.config?._retry) {
      console.log('⚠️  Localhost not available, switching to production URL...');
      console.log('Production URL:', PRODUCTION_URL);

      // Update the base URL to production
      axios.defaults.baseURL = PRODUCTION_URL;
      API_BASE_URL = PRODUCTION_URL;

      // Mark this request as retried to avoid infinite loop
      error.config._retry = true;
      error.config.baseURL = PRODUCTION_URL;

      console.log('🔄 Retrying request with production URL...');

      // Retry the request with production URL
      return axios.request(error.config);
    }

    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('Network Error - No response received');
    }
    console.log('=================');
    return Promise.reject(error);
  }
);

// Export the production URL for manual switching if needed
export { PRODUCTION_URL, LOCALHOST_URL };