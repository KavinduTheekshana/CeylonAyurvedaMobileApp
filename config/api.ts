// Environment-specific API configuration

// Default to production URL

let API_BASE_URL = 'https://app.ceylonayurvedahealth.co.uk';

// let API_BASE_URL = 'http://10.0.2.2:8000';
// let API_BASE_URL = 'http://192.168.0.213:8000';

console.log('=== API CONFIG LOADED ===');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('========================');



// Export constants for use in the app
export {
    API_BASE_URL
};

// You can add more API-related configuration here
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;

// Default axios configuration
import axios from 'axios';

// Set default timeout for all axios requests
axios.defaults.timeout = API_TIMEOUT;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST ===');
    console.log('URL:', config.url);
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

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    console.log('Data:', response.data);
    console.log('===================');
    return response;
  },
  (error) => {
    console.log('=== API ERROR ===');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('Network Error - No response received');
      console.log('Request:', error.request);
    }
    console.log('=================');
    return Promise.reject(error);
  }
);