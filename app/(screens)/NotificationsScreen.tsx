// app/(screens)/NotificationsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

// Add proper TypeScript interfaces
interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'promotional' | 'system';
  image_url?: string;
  sent_at: string;
  created_at: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface NotificationResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    pagination: PaginationData;
  };
}

const NotificationsScreen = () => {
  // Fix state typing by providing explicit types
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchNotifications = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const userToken = await AsyncStorage.getItem('access_token');
      if (!userToken) {
        Alert.alert('Error', 'Please login to view notifications');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications?page=${pageNum}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data: NotificationResponse = await response.json();

      if (data.success) {
        const newNotifications = data.data.notifications;
        
        if (isRefresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }

        setHasMore(pageNum < data.data.pagination.last_page);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'promotional':
        return 'megaphone-outline';
      case 'system':
        return 'settings-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'promotional':
        return '#10B981'; // green
      case 'system':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.typeContainer}>
          <Ionicons 
            name={getTypeIcon(item.type)} 
            size={16} 
            color={getTypeColor(item.type)} 
          />
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {item.type === 'promotional' ? 'Promotional' : 'System'}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {formatDate(item.sent_at)}
        </Text>
      </View>

      {item.image_url && (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.notificationImage}
          resizeMode="cover"
        />
      )}

      <Text style={styles.notificationTitle}>
        {item.title}
      </Text>
      
      <Text style={styles.notificationMessage}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No notifications yet</Text>
      <Text style={styles.emptyStateMessage}>
        You'll see promotional offers and system updates here
      </Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Keep your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;