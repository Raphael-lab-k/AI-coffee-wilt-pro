import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3LightTheme, Avatar, Text, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import DiagnosticsScreen from './screens/DiagnosticsScreen';
import DashboardScreen from './screens/DashboardScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatScreen from './screens/ChatScreen';
import TaskManagerScreen from './screens/TaskManagerScreen';
// import HeatmapScreen from './screens/HeatmapScreen';

const Tab = createBottomTabNavigator();

const coffeeTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3E2723', // Espresso Brown
    secondary: '#5D4037', // Roasted Bean
    tertiary: '#8D6E63', // Coffee Grounds
    background: '#F1F8E9', // Light Green / Sage
    surface: '#FFFFFF',
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      Alert.alert('Farmer Login Error', e.message);
    }
  };

  if (!user) {
    return (
      <PaperProvider theme={coffeeTheme}>
        <View style={styles.authContainer}>
          <Avatar.Icon size={100} icon="coffee" backgroundColor="#3E2723" color="#D7CCC8" style={{ marginBottom: 30 }} />
          <Text variant="displaySmall" style={{ color: '#3E2723', fontWeight: 'bold', textAlign: 'center' }}>CW PRO</Text>
          <Text variant="bodyLarge" style={{ color: '#5D4037', textAlign: 'center', marginBottom: 30 }}>Agronomy in your pocket</Text>
          <TextInput label="Email Address" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} autoCapitalize="none" />
          <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" style={styles.input} secureTextEntry />
          <Button mode="contained" onPress={handleAuth} style={styles.button}>
            {isRegistering ? 'Create Farmer Account' : 'Access My Plantation'}
          </Button>
          <Button mode="text" onPress={() => setIsRegistering(!isRegistering)} textColor="#5D4037">
            {isRegistering ? 'Back to Login' : 'New to CW PRO? Register'}
          </Button>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={coffeeTheme}>
      <NavigationContainer theme={{ colors: { background: '#F1F8E9' } }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Diagnose') iconName = 'image-filter-center-focus';
              else if (route.name === 'Chat') iconName = 'chat-processing';
              else if (route.name === 'Tasks') iconName = 'clipboard-check-multiple';
              else if (route.name === 'Health') iconName = 'chart-timeline-variant';
              else if (route.name === 'Records') iconName = 'book-open-variant';
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3E2723',
            tabBarInactiveTintColor: '#8D6E63',
            headerStyle: { backgroundColor: '#3E2723' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          })}
        >
          <Tab.Screen name="Diagnose" component={DiagnosticsScreen} options={{ title: 'Coffee Diagnosis' }} />
          <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'AI Agronomist' }} />
          <Tab.Screen name="Tasks" component={TaskManagerScreen} options={{ title: 'Smart Tasks' }} />
          <Tab.Screen name="Health" component={DashboardScreen} options={{ title: 'Plantation Health' }} />
          <Tab.Screen name="Records" component={HistoryScreen} options={{ title: 'Scouting Logs' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F1F8E9' },
  input: { marginBottom: 15 },
  button: { marginTop: 15, borderRadius: 10, paddingVertical: 6 },
});
