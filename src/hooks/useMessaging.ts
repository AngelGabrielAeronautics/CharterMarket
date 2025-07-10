import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Conversation,
  Message,
  CreateConversationData,
  MessageFormData,
  ConversationFilters,
  TypingIndicator,
  MessageSearchParams,
} from '@/types/message';
import {
  createConversation,
  getUserConversations,
  getConversation,
  sendMessage,
  getMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  findOrCreateConversation,
  setTypingIndicator,
  getTotalUnreadCount,
  searchMessages,
  listenToUserConversations,
  listenToMessages,
  listenToTypingIndicators,
} from '@/lib/messaging';
import toast from 'react-hot-toast';

// ==========================================
// CONVERSATION MANAGEMENT HOOKS
// ==========================================

/**
 * Hook for managing user's conversations with real-time updates
 */
export const useConversations = (filters: ConversationFilters = {}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.userCode) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = listenToUserConversations(
      user.userCode,
      (updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(false);
      },
      { limit: 50, ...filters }
    );

    unsubscribeRef.current = unsubscribe;

    // Handle listener errors
    const errorTimeout = setTimeout(() => {
      if (loading) {
        setError('Failed to load conversations');
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(errorTimeout);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user?.userCode, JSON.stringify(filters)]);

  const refreshConversations = useCallback(async () => {
    if (!user?.userCode) return;

    try {
      setLoading(true);
      const fetchedConversations = await getUserConversations(user.userCode, filters);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      setError('Failed to refresh conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.userCode, filters]);

  return {
    conversations,
    loading,
    error,
    refreshConversations,
  };
};

/**
 * Hook for managing a single conversation
 */
export const useConversation = (conversationId?: string) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const conv = await getConversation(id);
      setConversation(conv);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    } else {
      setConversation(null);
    }
  }, [conversationId, fetchConversation]);

  return {
    conversation,
    loading,
    error,
    refetch: () => conversationId && fetchConversation(conversationId),
  };
};

// ==========================================
// MESSAGE MANAGEMENT HOOKS
// ==========================================

/**
 * Hook for managing messages in a conversation with real-time updates
 */
export const useMessages = (conversationId?: string, limitCount: number = 50) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial messages and set up real-time listener
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener for messages
    const unsubscribe = listenToMessages(
      conversationId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        setLoading(false);
        setHasMore(updatedMessages.length >= limitCount);
      },
      limitCount
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId, limitCount]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;

    try {
      const oldestMessage = messages[0];
      const moreMessages = await getMessages(conversationId, limitCount, oldestMessage);
      
      if (moreMessages.length > 0) {
        setMessages(prev => [...moreMessages, ...prev]);
        setHasMore(moreMessages.length >= limitCount);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages');
    }
  }, [conversationId, messages, hasMore, loading, limitCount]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!conversationId || !user?.userCode) return;

    try {
      await markMessageAsRead(conversationId, messageId, user.userCode);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [conversationId, user?.userCode]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    if (!conversationId || !user?.userCode) return;

    try {
      await markAllMessagesAsRead(conversationId, user.userCode);
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  }, [conversationId, user?.userCode]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    markAsRead,
    markAllAsRead,
  };
};

/**
 * Hook for sending messages
 */
export const useMessageSender = (conversationId?: string) => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessageInConversation = useCallback(async (messageData: MessageFormData) => {
    if (!conversationId || !user?.userCode) {
      throw new Error('Conversation ID and user required');
    }

    try {
      setSending(true);
      setError(null);
      
      const messageId = await sendMessage(conversationId, messageData, user.userCode);
      
      // Show success toast for file uploads
      if (messageData.attachments && messageData.attachments.length > 0) {
        toast.success(`Message sent with ${messageData.attachments.length} attachment(s)`);
      }
      
      return messageId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationId, user?.userCode]);

  const sendTextMessage = useCallback(async (content: string, replyToMessageId?: string) => {
    return sendMessageInConversation({
      content,
      type: 'text',
      replyToMessageId,
    });
  }, [sendMessageInConversation]);

  const sendFileMessage = useCallback(async (content: string, files: File[]) => {
    return sendMessageInConversation({
      content,
      type: 'file',
      attachments: files,
    });
  }, [sendMessageInConversation]);

  return {
    sendMessage: sendMessageInConversation,
    sendTextMessage,
    sendFileMessage,
    sending,
    error,
  };
};

// ==========================================
// TYPING INDICATORS
// ==========================================

/**
 * Hook for managing typing indicators
 */
export const useTypingIndicators = (conversationId?: string) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to typing indicators
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = listenToTypingIndicators(conversationId, (indicators) => {
      // Filter out current user's typing indicator
      const othersTyping = indicators.filter(indicator => indicator.userCode !== user?.userCode);
      setTypingUsers(othersTyping);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId, user?.userCode]);

  // Set typing indicator
  const startTyping = useCallback(async () => {
    if (!conversationId || !user?.userCode || isTyping) return;

    try {
      const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
      await setTypingIndicator(conversationId, user.userCode, userName, true);
      setIsTyping(true);

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (err) {
      console.error('Error setting typing indicator:', err);
    }
  }, [conversationId, user, isTyping]);

  const stopTyping = useCallback(async () => {
    if (!conversationId || !user?.userCode || !isTyping) return;

    try {
      const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
      await setTypingIndicator(conversationId, user.userCode, userName, false);
      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('Error clearing typing indicator:', err);
    }
  }, [conversationId, user, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  };
};

// ==========================================
// CONVERSATION CREATION & MANAGEMENT
// ==========================================

/**
 * Hook for creating and managing conversations
 */
export const useConversationManager = () => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewConversation = useCallback(async (data: CreateConversationData) => {
    if (!user?.userCode) {
      throw new Error('User authentication required');
    }

    try {
      setCreating(true);
      setError(null);
      
      const conversationId = await createConversation(data, user.userCode);
      toast.success('Conversation created successfully');
      return conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [user?.userCode]);

  const findOrCreateContextConversation = useCallback(async (
    participantUserCodes: string[],
    contextType: 'quote' | 'booking' | 'invoice' | 'general',
    contextId?: string
  ) => {
    if (!user?.userCode) {
      throw new Error('User authentication required');
    }

    try {
      setCreating(true);
      setError(null);
      
      const conversationId = await findOrCreateConversation(
        participantUserCodes,
        contextType,
        contextId,
        user.userCode
      );
      
      return conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find or create conversation';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [user?.userCode]);

  return {
    createConversation: createNewConversation,
    findOrCreateConversation: findOrCreateContextConversation,
    creating,
    error,
  };
};

// ==========================================
// UNREAD COUNT MANAGEMENT
// ==========================================

/**
 * Hook for managing unread message counts
 */
export const useUnreadCount = () => {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.userCode) {
      setTotalUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await getTotalUnreadCount(user.userCode);
      setTotalUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.userCode]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    totalUnreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
  };
};

// ==========================================
// MESSAGE SEARCH
// ==========================================

/**
 * Hook for searching messages
 */
export const useMessageSearch = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessagesByQuery = useCallback(async (searchParams: MessageSearchParams) => {
    if (!user?.userCode) {
      throw new Error('User authentication required');
    }

    try {
      setSearching(true);
      setError(null);
      
      const results = await searchMessages(user.userCode, searchParams);
      setSearchResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setSearching(false);
    }
  }, [user?.userCode]);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    searching,
    error,
    searchMessages: searchMessagesByQuery,
    clearSearchResults,
  };
};

// ==========================================
// COMPOSITE HOOKS
// ==========================================

/**
 * All-in-one hook for a complete conversation view
 */
export const useConversationView = (conversationId?: string) => {
  const conversationHook = useConversation(conversationId);
  const messagesHook = useMessages(conversationId);
  const senderHook = useMessageSender(conversationId);
  const typingHook = useTypingIndicators(conversationId);

  return {
    // Conversation data
    conversation: conversationHook.conversation,
    conversationLoading: conversationHook.loading,
    conversationError: conversationHook.error,
    refetchConversation: conversationHook.refetch,

    // Messages data
    messages: messagesHook.messages,
    messagesLoading: messagesHook.loading,
    messagesError: messagesHook.error,
    hasMoreMessages: messagesHook.hasMore,
    loadMoreMessages: messagesHook.loadMoreMessages,
    markAsRead: messagesHook.markAsRead,
    markAllAsRead: messagesHook.markAllAsRead,

    // Message sending
    sendMessage: senderHook.sendMessage,
    sendTextMessage: senderHook.sendTextMessage,
    sendFileMessage: senderHook.sendFileMessage,
    sending: senderHook.sending,
    sendError: senderHook.error,

    // Typing indicators
    typingUsers: typingHook.typingUsers,
    isTyping: typingHook.isTyping,
    startTyping: typingHook.startTyping,
    stopTyping: typingHook.stopTyping,
  };
}; 