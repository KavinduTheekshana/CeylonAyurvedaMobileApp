import { API_BASE_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatRoom {
  id: number;
  therapist: {
    id: number;
    name: string;
    image: string | null;
    bio: string;
  };
  last_message: {
    content: string;
    sent_at: string;
    sender_name: string;
    sender_type: 'patient' | 'therapist'; 
  } | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    type: 'patient' | 'therapist'; 
  };
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  sent_at: string;
  edited_at: string | null;
}

export interface SendMessageData {
  message: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface MessagePagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more_pages: boolean;
}

class ChatService {

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getChatRooms(): Promise<{ 
    success: boolean; 
    data: ChatRoom[]; 
    message?: string 
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          data: [], 
          message: result.message || `HTTP ${response.status}` 
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return { 
        success: false, 
        data: [], 
        message: 'Network error. Please check your connection.' 
      };
    }
  }

  async createOrAccessChat(therapistId: number): Promise<{ 
    success: boolean; 
    data?: { 
      chat_room_id: number; 
      therapist: any;
      created_at: string;
    }; 
    message?: string 
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/chats/therapist/${therapistId}`, {
        method: 'POST',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: result.message || `HTTP ${response.status}` 
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error creating/accessing chat:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    }
  }

  async getMessages(chatRoomId: number, page: number = 1, perPage: number = 20): Promise<{
    success: boolean;
    data?: {
      messages: ChatMessage[];
      pagination: MessagePagination;
    };
    message?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}/messages?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers,
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: result.message || `HTTP ${response.status}` 
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    }
  }

  async sendMessage(chatRoomId: number, messageData: SendMessageData): Promise<{
    success: boolean;
    data?: ChatMessage;
    message?: string;
    errors?: any;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatRoomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(messageData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: result.message || `HTTP ${response.status}`,
          errors: result.errors 
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    }
  }

  async getChatStats(): Promise<{
    success: boolean;
    data?: {
      total_chat_rooms: number;
      active_chat_rooms: number;
      total_messages: number;
      messages_today: number;
      messages_this_week: number;
    };
    message?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/chats/stats`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: result.message || `HTTP ${response.status}` 
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    }
  }
}

export const chatService = new ChatService();