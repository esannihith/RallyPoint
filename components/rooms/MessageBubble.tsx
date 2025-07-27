import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { ChatMessage } from '@/types/socket';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.sentContainer : styles.receivedContainer
    ]}>
      <View style={[
        styles.bubble,
        isCurrentUser ? styles.sentBubble : styles.receivedBubble
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{message.userName}</Text>
        )}
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.sentText : styles.receivedText
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.timestamp,
          isCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp
        ]}>
          {formatTime(message.timestamp)}
          {isCurrentUser && (
            <View style={styles.statusIcon}>
              {message.status === 'sending' && (
                <Clock size={12} color={isCurrentUser ? "rgba(255, 255, 255, 0.7)" : "#9CA3AF"} />
              )}
              {message.status === 'sent' && (
                <Check size={12} color={isCurrentUser ? "rgba(255, 255, 255, 0.7)" : "#9CA3AF"} />
              )}
              {(message.status === 'delivered' || !message.status) && (
                <CheckCheck size={12} color={isCurrentUser ? "rgba(255, 255, 255, 0.7)" : "#9CA3AF"} />
              )}
              {message.status === 'failed' && (
                <Text style={[styles.failedIcon, { color: isCurrentUser ? "rgba(255, 255, 255, 0.7)" : "#EF4444" }]}>!</Text>
              )}
            </View>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: 16,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sentBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 6,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTimestamp: {
    color: '#9CA3AF',
  },
  statusIcon: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});