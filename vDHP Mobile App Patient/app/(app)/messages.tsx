import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { GradientButton } from '@/components/ui/GradientButton';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { messageService } from '@/services/api';

export default function MessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      if (patientId) {
        const data = await messageService.getMessages(patientId, 1);
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      if (patientId) {
        await messageService.sendMessage(patientId, {
          recipient_id: 'provider-1',
          recipient_type: 'provider',
          message_text: newMessage,
        });
        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <Card style={StyleSheet.flatten([styles.messageCard, 
      item.sender_type === 'patient' ? styles.myMessage : styles.theirMessage
    ])}>
      <Text style={styles.senderName}>{item.sender_name}</Text>
      <Text style={styles.messageText}>{item.message_text}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </Card>
  );

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Chat with your care team</Text>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          inverted
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </Card>
          }
        />

        <View style={styles.inputContainer}>
          <Input
            label="Type your message"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Ask your care team anything..."
            multiline
          />
          <GradientButton
            title="Send"
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
            size="medium"
            loading={sending}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  messageCard: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.dark.primary + '30',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.backgroundCard,
  },
  senderName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    marginBottom: 4,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.base,
  },
  messageTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.dark.textTertiary,
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
  },
});