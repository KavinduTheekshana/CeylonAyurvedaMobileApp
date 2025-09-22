import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

export interface UserPreferences {
  service_user_preferences: {
    preferred_therapist_gender: 'all' | 'male' | 'female';
    preferred_language: string;
    age_range_therapist: {
      start: number;
      end: number;
    };
  };
  last_updated?: string;
}

class UserPreferencesService {
  
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('access_token');
  }

  private async getHeaders() {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch preferences');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<{
    preferred_therapist_gender: 'all' | 'male' | 'female';
    preferred_language: string;
    preferred_age_range_therapist_start: number;
    preferred_age_range_therapist_end: number;
  }>): Promise<UserPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update preferences');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async resetPreferences(): Promise<UserPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences/reset`, {
        method: 'POST',
        headers: await this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset preferences');
      }

      return data.data;
    } catch (error) {
      console.error('Error resetting user preferences:', error);
      throw error;
    }
  }
}

export default new UserPreferencesService();