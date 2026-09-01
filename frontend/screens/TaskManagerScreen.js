import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Checkbox, FAB, Portal, Modal, TextInput, Button, List, IconButton, Surface } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

export default function TaskManagerScreen() {
  const [tasks, setTasks] = useState([]);
  const [visible, setVisible] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', frequency: '7' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(docs);
    });
  }, []);

  const addTask = async () => {
    if (!newTask.title) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: auth.currentUser.uid,
        title: newTask.title,
        description: newTask.description,
        frequency: parseInt(newTask.frequency),
        completed: false,
        createdAt: Date.now(),
        nextReminder: Date.now() + (parseInt(newTask.frequency) * 24 * 60 * 60 * 1000)
      });

      // Schedule a notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌱 Smart Task Reminder",
          body: `It's time for: ${newTask.title}`,
        },
        trigger: { seconds: parseInt(newTask.frequency) * 86400 },
      });

      setVisible(false);
      setNewTask({ title: '', description: '', frequency: '7' });
    } catch (e) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const toggleTask = async (task) => {
    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, { completed: !task.completed });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.headerTitle}>Smart Task Manager</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>Optimized for Coffee Cycles</Text>
        </Surface>

        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <IconButton icon="clipboard-text-outline" size={80} iconColor="#D7CCC8" />
            <Text variant="titleMedium" style={{ color: '#8D6E63' }}>No active tasks. Tap + to auto-schedule.</Text>
          </View>
        ) : (
          tasks.map(item => (
            <Card key={item.id} style={[styles.taskCard, item.completed && styles.completedCard]}>
              <Card.Title
                title={item.title}
                subtitle={`Frequency: Every ${item.frequency} days`}
                left={(props) => <Checkbox status={item.completed ? 'checked' : 'unchecked'} onPress={() => toggleTask(item)} />}
                right={(props) => <IconButton {...props} icon="delete-outline" onPress={() => deleteTask(item.id)} />}
              />
              <Card.Content>
                <Text variant="bodySmall" style={styles.desc}>{item.description}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Schedule New Task</Text>
          <TextInput
            label="Task Name (e.g. NPK Application)"
            value={newTask.title}
            onChangeText={t => setNewTask({...newTask, title: t})}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={newTask.description}
            onChangeText={t => setNewTask({...newTask, description: t})}
            mode="outlined"
            multiline
            style={styles.input}
          />
          <TextInput
            label="Cycle Frequency (Days)"
            value={newTask.frequency}
            onChangeText={t => setNewTask({...newTask, frequency: t})}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <Button mode="contained" onPress={addTask} style={styles.addBtn}>
            Start Auto-Schedule
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setVisible(true)}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { padding: 20, backgroundColor: '#fff', borderRadius: 12, marginBottom: 20 },
  headerTitle: { color: '#3E2723', fontWeight: 'bold' },
  headerSub: { color: '#8D6E63' },
  taskCard: { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff' },
  completedCard: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  desc: { color: '#5D4037', marginTop: -8 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#3E2723' },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 16 },
  modalTitle: { marginBottom: 16, color: '#3E2723', fontWeight: 'bold' },
  input: { marginBottom: 12 },
  addBtn: { marginTop: 8, backgroundColor: '#3E2723' },
  empty: { alignItems: 'center', marginTop: 100 }
});
