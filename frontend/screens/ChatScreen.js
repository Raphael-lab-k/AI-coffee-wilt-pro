import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Text, Surface, Avatar, ActivityIndicator } from 'react-native-paper';
import { auth } from '../firebaseConfig';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am your CW PRO AI Agronomist. How can I help your coffee plantation today?", isAi: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), text: input, isAi: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://10.0.2.2:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        text: data.status === 'success' ? data.answer : "Sorry, I am having trouble connecting. Please check your signal.",
        isAi: true
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Network error. Please try again.", isAi: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.messageRow, msg.isAi ? styles.aiRow : styles.userRow]}>
            {msg.isAi && <Avatar.Icon size={32} icon="robot" style={styles.aiAvatar} backgroundColor="#3E2723" />}
            <Surface style={[styles.bubble, msg.isAi ? styles.aiBubble : styles.userBubble]} elevation={1}>
              <Text style={[styles.msgText, msg.isAi ? styles.aiText : styles.userText]}>{msg.text}</Text>
            </Surface>
          </View>
        ))}
        {loading && (
          <View style={styles.aiRow}>
            <ActivityIndicator size="small" color="#3E2723" style={{ marginLeft: 40 }} />
          </View>
        )}
      </ScrollView>

      <Surface style={styles.inputContainer} elevation={4}>
        <TextInput
          placeholder="Ask about pruning, fertilizer, pests..."
          value={input}
          onChangeText={setInput}
          mode="outlined"
          style={styles.textInput}
          outlineColor="#D7CCC8"
          activeOutlineColor="#3E2723"
          multiline
          dense
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor="#3E2723"
          iconColor="#fff"
          onPress={sendMessage}
          disabled={loading}
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scrollContent: { padding: 16, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  aiAvatar: { marginRight: 8, marginBottom: 4 },
  bubble: { padding: 12, borderRadius: 18, maxWidth: '80%' },
  aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  userBubble: { backgroundColor: '#3E2723', borderBottomRightRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 20 },
  aiText: { color: '#333' },
  userText: { color: '#fff' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  textInput: { flex: 1, maxHeight: 100, backgroundColor: '#FAFAFA' },
});
