// services/investmentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

class InvestmentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/investments`;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Get user's investment summary
  async getUserInvestmentSummary() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/summary`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching investment summary:', error);
      throw error;
    }
  }

  // Get user's investment history
  async getUserInvestments(page = 1) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}?page=${page}`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user investments:', error);
      throw error;
    }
  }

  // Get investment opportunities (locations)
  async getInvestmentOpportunities() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/opportunities`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching investment opportunities:', error);
      throw error;
    }
  }

  // Get location investment details
  async getLocationInvestmentDetails(locationId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/locations/${locationId}`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching location investment details:', error);
      throw error;
    }
  }

  // Create new investment
  async createInvestment(locationId, amount, notes = '') {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: locationId,
          amount: amount,
          notes: notes,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating investment:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/confirm-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
}

export default new InvestmentService();