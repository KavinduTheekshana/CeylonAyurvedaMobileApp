import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatService, ChatMessage, MessagePagination } from '../services/chatService';
import { useNavigation } from 'expo-router';

const ChatScreen = () => {
  const { roomId, therapistName } = useLocalSearchParams<{
    roomId: string;
    therapistName: string;
  }>();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<MessagePagination | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const navigation = useNavigation();
  
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
    if (roomId) {
      fetchMessages();
    }

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [roomId]);


  // Set navigation header with therapist name
useEffect(() => {
  if (therapistName) {
    navigation.setOptions({
      title: therapistName,
    });
  }
}, [navigation, therapistName]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user information');
    }
  };

  const fetchMessages = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await chatService.getMessages(Number(roomId), pageNum);
      
      if (result.success && result.data) {
        const newMessages = result.data.messages;
        setPagination(result.data.pagination);
        
        if (append && pageNum > 1) {
          // Prepend older messages
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
          // Scroll to bottom for initial load
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (pagination && pagination.has_more_pages && !loadingMore) {
      fetchMessages(pagination.current_page + 1, true);
    }
  };

  const sendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText || sending) return;

    // Clear input immediately for better UX
    setNewMessage('');
    setSending(true);

    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      content: messageText,
      sender: {
        id: currentUserId!,
        name: 'You',
        type: 'patient' 
      },
      message_type: 'text',
      is_read: false,
      sent_at: new Date().toISOString(),
      edited_at: null
    };

    setMessages(prev => [...prev, tempMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await chatService.sendMessage(Number(roomId), {
        message: messageText,
        message_type: 'text'
      });

      if (result.success && result.data) {
        // Replace temp message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? result.data! : msg
          )
        );
      } else {
        // Remove temp message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNewMessage(messageText); // Restore message
        Alert.alert('Error', result.message || 'Failed to send message');
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageText); // Restore message
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (e) {
      return '';
    }
  };

  const shouldShowDateHeader = (currentMessage: ChatMessage, previousMessage: ChatMessage | null) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.sent_at).toDateString();
    const previousDate = new Date(previousMessage.sent_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.sender.type === 'patient';
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(item, previousMessage);
    
    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDate(item.sent_at)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            {!isMyMessage && (
              <Text style={styles.senderName}>{item.sender.name}</Text>
            )}
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.sent_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLoadMoreHeader = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#8E8E93" />
        <Text style={styles.loadingMoreText}>Loading older messages...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#9A563A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{therapistName || 'Chat'}</Text>
          <View style={styles.placeholder} />
        </View> */}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#9A563A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {therapistName || 'Chat'}
        </Text>
        <View style={styles.placeholder} />
      </View> */}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: Math.max(20, keyboardHeight * 0.1) }
        ]}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderLoadMoreHeader}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />

      {/* Message Input */}
      <View style={[
        styles.inputContainer,
        Platform.OS === 'ios' && { paddingBottom: Math.max(20, keyboardHeight * 0.05) }
      ]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={2000}
            returnKeyType="send"
            enablesReturnKeyAutomatically
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   paddingTop: 50,
  //   paddingHorizontal: 16,
  //   paddingBottom: 12,
  //   backgroundColor: '#FFFFFF',
  //   borderBottomWidth: 0.5,
  //   borderBottomColor: '#C6C6C8',
  // },
  // backButton: {
  //   padding: 8,
  //   marginLeft: -8,
  // },
  // headerTitle: {
  //   fontSize: 17,
  //   fontWeight: '600',
  //   color: '#000000',
  //   flex: 1,
  //   textAlign: 'center',
  //   marginHorizontal: 16,
  // },
  // placeholder: {
  //   width: 44,
  // },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    marginVertical: 3,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#9A563A',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: '#000000',
    marginRight: 8,
    paddingVertical: 4,
  },
  sendButton: {
    backgroundColor: '#9A563A',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C6C6C8',
  },
});

export default ChatScreen;