// app/services/treatmentHistoryService.ts - Updated Interface

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

export interface TreatmentHistory {
  id: number;
  booking_id: number;
  booking_reference: string;
  service_title: string;
  therapist_name: string;
  therapist_nickname?: string | null;
  treatment_date: string;
  treatment_time: string;
  formatted_date: string;
  patient_condition: 'improved' | 'same' | 'worse' | null;
  condition_description: string;
  pain_improvement: {
    before: number;
    after: number;
    improvement: number;
    improvement_percentage: number;
    description: string;
  } | null;
  treatment_completed_at: string;
  has_recommendations: boolean;
  has_treatment_notes: boolean;
  has_observations: boolean;
  // New fields for full details
  treatment_notes: string | null;
  observations: string | null;
  recommendations: string | null;
  next_treatment_plan: string | null;
  areas_treated: string[] | null;
  // Additional booking details
  address_line1: string;
  city: string;
  postcode: string;
  duration: number;
}

export interface TreatmentHistoryDetail {
  id: number;
  booking: {
    reference: string;
    date: string;
    time: string;
    formatted_date: string;
    formatted_time: string;
    address: {
      line1: string;
      city: string;
      postcode: string;
    };
  };
  service: {
    title: string;
    duration: number;
  };
  therapist: {
    name: string;
    nickname?: string | null;
  };
  treatment_details: {
    treatment_notes: string;
    observations: string;
    patient_condition: string;
    condition_description: string;
    pain_improvement: any;
    areas_treated: string[];
    treatment_completed_at: string;
    formatted_treatment_date: string;
  };
  recommendations: string | null;
  next_treatment_plan: string | null;
  has_follow_up_needed: boolean;
}

class TreatmentHistoryService {
  private baseURL = `${API_BASE_URL}/api/user`;

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getUserTreatmentHistories(page = 1): Promise<{
    data: TreatmentHistory[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    success: boolean;
    message?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/treatment-histories?page=${page}`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching treatment histories:', error);
      throw error;
    }
  }

  async getTreatmentHistoryByBooking(bookingId: number): Promise<{
    data: TreatmentHistoryDetail;
    success: boolean;
    message?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/bookings/${bookingId}/treatment-history`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching treatment history details:', error);
      throw error;
    }
  }

  async checkTreatmentHistoryExists(bookingId: number): Promise<boolean> {
    try {
      const result = await this.getTreatmentHistoryByBooking(bookingId);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

export default new TreatmentHistoryService();