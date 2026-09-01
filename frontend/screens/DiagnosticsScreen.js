import React, { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Button, Card, Text, TextInput, Divider, Surface, IconButton } from 'react-native-paper';
import * as Notifications from 'expo-notifications';

export default function DiagnosticsScreen() {
  const [fieldName, setFieldName] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [previewUri, setPreviewUri] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select a coffee plant photo.');

  const requestPermissions = async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const loc = await Location.requestForegroundPermissionsAsync();
    return camera.granted && media.granted && loc.granted;
  };

  const pickImage = async () => {
    if (!(await requestPermissions())) return;
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
    if (!res.canceled) {
      setPreviewUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || '');
      setResult(null);
    }
  };

  const takePhoto = async () => {
    if (!(await requestPermissions())) return;
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (!res.canceled) {
      setPreviewUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || '');
      setResult(null);
    }
  };

  const detectPlant = async () => {
    if (!imageBase64) return Alert.alert('Error', 'Please provide a coffee leaf or branch photo.');

    setLoading(true);
    setResult(null);

    try {
      const netStatus = await Network.getNetworkStateAsync();
      const isOnline = netStatus.isInternetReachable;

      let currentLoc = null;
      try {
        currentLoc = await Location.getLastKnownPositionAsync({});
        if (!currentLoc) {
          currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (currentLoc) {
          currentLoc = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
        }
      } catch (e) {}

      const scanPayload = {
        imageBase64, fieldName, notes,
        soilMoisture: parseFloat(soilMoisture) || 0,
        temperature: parseFloat(temperature) || 0,
        location: currentLoc,
      };

      if (!isOnline) {
        const offlineResult = {
          label: 'Offline: Analysis Pending',
          severity: 'medium',
          advice: 'Scan saved to queue. Full AI review will happen when online.',
          isOffline: true,
          ...scanPayload,
          timestamp: Date.now()
        };
        const existing = await AsyncStorage.getItem('offline_scans');
        const queue = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem('offline_scans', JSON.stringify([...queue, scanPayload]));
        setResult(offlineResult);
        setStatusMessage('Offline: Scan queued.');
      } else {
        const apiPromise = fetch('http://10.0.2.2:4000/api/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scanPayload),
        }).then(res => res.json());

        const storageRef = ref(storage, `scans/${auth.currentUser.uid}/${Date.now()}.jpg`);
        const uploadPromise = uploadString(storageRef, imageBase64, 'base64')
          .then(() => getDownloadURL(storageRef))
          .catch(() => null);

        const [apiData, imageUrl] = await Promise.all([apiPromise, uploadPromise]);

        if (apiData.status === 'success') {
          const scanData = {
            ...apiData.detection,
            userId: auth.currentUser.uid,
            imageUrl,
            timestamp: Date.now(),
            location: currentLoc
          };
          await addDoc(collection(db, 'scans'), scanData);
          setResult(scanData);

          if (scanData.severity === 'high') {
            await Notifications.scheduleNotificationAsync({
              content: { title: "⚠️ Critical Crop Alert", body: `High severity: ${scanData.label}` },
              trigger: null,
            });
          }
        }
      }
    } catch (e) {
      Alert.alert('Analysis Failed', 'Check your connection or Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (isCorrect) => {
    if (!result?.id) return;
    try {
      await addDoc(collection(db, 'training_feedback'), {
        scanId: result.id, userId: auth.currentUser.uid, isCorrect,
        label: result.label, imageUrl: result.imageUrl, timestamp: Date.now()
      });
      Alert.alert('Thank you!', 'Your feedback helps improve our models.');
    } catch (e) {}
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.label}>Coffee Plantation Data</Text>
          <TextInput label="Plantation Section" value={fieldName} onChangeText={setFieldName} mode="outlined" style={styles.input} />
          <View style={styles.row}>
            <TextInput label="Soil Moist %" value={soilMoisture} onChangeText={setSoilMoisture} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 8 }]} />
            <TextInput label="Elevation (m)" value={temperature} onChangeText={setTemperature} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1 }]} />
          </View>

          <View style={styles.mediaButtons}>
            <Button mode="outlined" onPress={pickImage} style={{ flex: 1, marginRight: 8 }} icon="image">Upload</Button>
            <Button mode="outlined" onPress={takePhoto} style={{ flex: 1 }} icon="camera">Snap</Button>
          </View>

          {previewUri ? <Image source={{ uri: previewUri }} style={styles.image} /> : null}

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3E2723" />
              <Text style={styles.loadingText}>Expert analysis in progress...</Text>
            </View>
          ) : (
            <Button mode="contained" onPress={detectPlant} disabled={!imageBase64} style={styles.detectBtn}>
              Diagnose Coffee Health
            </Button>
          )}

          {result && (
            <Surface style={[styles.resBox, { borderLeftColor: result.severity === 'high' ? '#B00020' : '#4CAF50' }]}>
              <View style={styles.resultHeader}>
                <Text variant="headlineSmall" style={{ color: '#3E2723' }}>{result.label}</Text>
                <IconButton icon="check-decagram" iconColor="#4CAF50" />
              </View>
              <Text variant="bodySmall">Accuracy: {(result.confidence * 100).toFixed(0)}%</Text>
              <Divider style={{ marginVertical: 8 }} />
              <Text variant="bodyMedium" style={styles.reasoning}>{result.reasoning}</Text>
              <Divider style={{ marginVertical: 8 }} />
              <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Agronomist Advice:</Text>
              <Text style={{ marginBottom: 15 }}>{result.advice}</Text>
              <View style={styles.feedbackRow}>
                <Button mode="outlined" onPress={() => submitFeedback(true)} icon="thumb-up-outline" style={styles.feedbackBtn}>Correct</Button>
                <Button mode="outlined" onPress={() => submitFeedback(false)} icon="thumb-down-outline" style={styles.feedbackBtn}>Wrong</Button>
              </View>
            </Surface>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F1F8E9' },
  card: { borderRadius: 16, elevation: 4 },
  label: { marginBottom: 12, color: '#3E2723' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { marginBottom: 10 },
  mediaButtons: { flexDirection: 'row', marginTop: 10 },
  detectBtn: { marginTop: 20, backgroundColor: '#3E2723', paddingVertical: 8 },
  image: { width: '100%', height: 240, marginTop: 16, borderRadius: 16 },
  loaderContainer: { alignItems: 'center', marginVertical: 20 },
  loadingText: { color: '#5D4037', fontWeight: 'bold', marginTop: 10 },
  resBox: { marginTop: 20, padding: 20, backgroundColor: '#FAFAFA', borderLeftWidth: 10, borderRadius: 12 },
  reasoning: { fontStyle: 'italic', color: '#5D4037' },
  feedbackRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  feedbackBtn: { borderRadius: 8, flex: 0.45 },
});
