import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Linking, Image } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { List, Card, Avatar, Text, IconButton, Divider } from 'react-native-paper';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    });
  }, []);

  const openInMaps = (lat, lon) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.historyCard}>
      {item.imageUrl && (
        <Card.Cover source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      )}
      <List.Item
        title={item.label}
        titleStyle={{ fontWeight: 'bold', color: item.severity === 'high' ? '#B00020' : '#1B5E20' }}
        description={`${item.field} • ${new Date(item.timestamp).toLocaleDateString()}`}
        left={props => <Avatar.Icon {...props} icon="leaf" size={40} backgroundColor={item.severity === 'high' ? '#FFEBEE' : '#E8F5E9'} color={item.severity === 'high' ? '#B00020' : '#4CAF50'} />}
        right={props => item.location ? (
          <IconButton {...props} icon="map-marker" onPress={() => openInMaps(item.location.latitude, item.location.longitude)} />
        ) : null}
      />
      <Card.Content>
        <Text variant="bodySmall" numberOfLines={2}>{item.advice}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No scans found. Start scanning in the Diagnostics tab!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F1F8E9' },
  historyCard: { borderRadius: 16, elevation: 3, overflow: 'hidden' },
  thumbnail: { height: 150 },
  empty: { textAlign: 'center', marginTop: 50, color: '#666' }
});
