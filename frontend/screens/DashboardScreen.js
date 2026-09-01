import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Text, Card, ProgressBar, Surface, Avatar, List } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';

export default function DashboardScreen() {
  const [history, setHistory] = useState([]);
  const [healthScore, setHealthScore] = useState(100);
  const [chartData, setChartData] = useState({
    labels: ["S1", "S2", "S3", "S4", "S5"],
    datasets: [{ data: [0, 0, 0, 0, 0] }]
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setHistory(docs);

      if (docs.length > 0) {
        const highStress = docs.filter(h => h.severity === 'high').length;
        setHealthScore(Math.max(0, 100 - (highStress * 20)));

        const reversedDocs = [...docs].reverse();
        const moistureData = reversedDocs.map(d => d.soilMoisture || 0);
        const timeLabels = reversedDocs.map((_, i) => `S${i+1}`);

        if (moistureData.length > 1) {
          setChartData({
            labels: timeLabels,
            datasets: [{ data: moistureData }]
          });
        }
      }
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Surface style={styles.dashboard} elevation={4}>
        <View style={styles.dashHeader}>
          <View>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>Field Health: {healthScore}%</Text>
            <Text style={{ color: '#E8F5E9' }}>{auth.currentUser?.email}</Text>
          </View>
          <Avatar.Icon size={56} icon="sprout" backgroundColor="#81C784" color="#1B5E20" />
        </View>
        <ProgressBar progress={healthScore / 100} color="#fff" style={styles.progress} />
      </Surface>

      <Text variant="titleLarge" style={styles.sectionTitle}>Moisture Trends (%)</Text>
      <Card style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 48}
          height={220}
          chartConfig={{
            backgroundColor: "#3E2723",
            backgroundGradientFrom: "#3E2723",
            backgroundGradientTo: "#5D4037",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "6", strokeWidth: "2", stroke: "#81C784" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Card.Content style={styles.centered}>
            <Avatar.Icon size={40} icon="thermometer" backgroundColor="#FFE082" color="#FF8F00" />
            <Text variant="bodyMedium">Last Temp</Text>
            <Text variant="titleLarge">{history[0]?.temperature || '--'}°C</Text>
          </Card.Content>
        </Card>
        <Card style={styles.metricCard}>
          <Card.Content style={styles.centered}>
            <Avatar.Icon size={40} icon="water" backgroundColor="#BBDEFB" color="#1976D2" />
            <Text variant="bodyMedium">Last Moist</Text>
            <Text variant="titleLarge">{history[0]?.soilMoisture || '--'}%</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F1F8E9' },
  dashboard: { padding: 24, backgroundColor: '#3E2723', borderRadius: 20, marginBottom: 24 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progress: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { marginVertical: 12, color: '#3E2723', fontWeight: 'bold' },
  chartCard: { borderRadius: 16, padding: 8, backgroundColor: '#3E2723' },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricCard: { flex: 0.48, borderRadius: 16 },
  centered: { alignItems: 'center' },
});
