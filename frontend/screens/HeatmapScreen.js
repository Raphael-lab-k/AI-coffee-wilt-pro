import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { db } from '../firebaseConfig';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { Text, Surface, Avatar, Chip } from 'react-native-paper';

export default function HeatmapScreen() {
  const [outbreaks, setOutbreaks] = useState([]);
  const [region, setRegion] = useState({
    latitude: 0.3476, // Default to a central coffee region
    longitude: 32.5825,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  useEffect(() => {
    // Fetch recent outbreaks from ALL users (anonymized)
    const q = query(
      collection(db, 'scans'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.location && d.severity === 'high'); // Only show high-severity threats
      setOutbreaks(docs);

      if (docs.length > 0) {
        setRegion(prev => ({
          ...prev,
          latitude: docs[0].location.latitude,
          longitude: docs[0].location.longitude,
        }));
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {outbreaks.map(item => (
          <React.Fragment key={item.id}>
            <Marker
              coordinate={{
                latitude: item.location.latitude,
                longitude: item.location.longitude,
              }}
              title={item.label}
              description={`Detected in ${item.field}`}
            >
              <Avatar.Icon size={30} icon="alert-decagram" backgroundColor="#B00020" color="#fff" />
            </Marker>
            <Circle
              center={{
                latitude: item.location.latitude,
                longitude: item.location.longitude,
              }}
              radius={2000} // 2km radius impact zone
              fillColor="rgba(176, 0, 32, 0.2)"
              strokeColor="rgba(176, 0, 32, 0.5)"
            />
          </React.Fragment>
        ))}
      </MapView>

      <Surface style={styles.legend} elevation={4}>
        <Text variant="titleMedium" style={styles.title}>Community Threat Level</Text>
        <View style={styles.row}>
          <Chip icon="alert-circle" style={{ backgroundColor: '#FFEBEE' }} textStyle={{ color: '#B00020' }}>
            {outbreaks.length} Active Outbreaks
          </Chip>
        </View>
        <Text variant="bodySmall" style={styles.sub}>
          Real-time anonymized disease tracking across your region.
        </Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16
  },
  title: { color: '#3E2723', fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 8 },
  sub: { color: '#8D6E63', fontStyle: 'italic' }
});
