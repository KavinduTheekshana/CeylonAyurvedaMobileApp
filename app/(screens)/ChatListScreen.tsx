import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatService, ChatRoom } from '@/services/chatService';
import { getTherapistDisplayName } from '@/utils/therapistUtils'; 

const ChatListScreen = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchChatRooms = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await chatService.getChatRooms();
      
      if (result.success) {
        setChatRooms(result.data);
      } else {
        setError(result.message || 'Failed to fetch chat rooms');
        if (!isRefresh) {
          Alert.alert('Error', result.message || 'Failed to load chats');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChatRooms();
    }, [])
  );

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const hasUnread = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => router.push({
          pathname: '/(screens)/ChatScreen',
          params: {
            roomId: item.id.toString(),
            therapistName: getTherapistDisplayName(item.therapist)
          }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.therapist.image ? (
            <Image
              source={{ uri: item.therapist.image }}
              style={styles.avatar}
              onError={() => console.warn('Failed to load therapist image')}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.therapist.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.therapistName, hasUnread && styles.therapistNameUnread]} numberOfLines={1}>
              {getTherapistDisplayName(item.therapist)}
            </Text>
            <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>

          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={2}>
            {item.last_message
              ? item.last_message.content
              : 'No messages yet - Start the conversation!'
            }
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtext}>
        Book a session with a therapist to start chatting
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.browseButtonText}>Browse Therapists</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Unable to Load Chats</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => fetchChatRooms()}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading your chats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {error && !loading ? (
        renderErrorState()
      ) : chatRooms.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChatRooms(true)}
              colors={['#9A563A']}
              tintColor="#9A563A"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  refreshButton: {
    padding: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  browseButton: {
    backgroundColor: '#9A563A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#9A563A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    backgroundColor: '#9A563A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  therapistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  therapistNameUnread: {
    fontWeight: '700',
  },
  timestampUnread: {
    color: '#9A563A',
    fontWeight: '600',
  },
  lastMessageUnread: {
    color: '#000000',
    fontWeight: '600',
  },
});

export default ChatListScreen;