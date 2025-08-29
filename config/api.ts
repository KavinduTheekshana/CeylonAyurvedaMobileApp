// Environment-specific API configuration

// Default to production URL

// let API_BASE_URL = 'https://app.ceylonayurvedahealth.co.uk';

let API_BASE_URL = 'http://10.0.2.2:8000';
// let API_BASE_URL = 'http://192.168.0.213:8000';



// Export constants for use in the app
export {
    API_BASE_URL
};

// You can add more API-related configuration here
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;