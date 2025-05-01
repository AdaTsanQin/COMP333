import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/login.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const rawText = await res.text();
      console.log('[Login] Raw response:', rawText);

      const data = JSON.parse(rawText);
      if (data.success && data.session_id) {
        console.log('[Login] Session ID received:', data.session_id);

        await AsyncStorage.setItem('PHPSESSID', data.session_id);
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('role', role);

        const sid = await AsyncStorage.getItem('PHPSESSID');
        console.log('[Login] PHPSESSID stored in AsyncStorage:', sid);

        Alert.alert('Success', 'Login successful!');
        navigation.navigate('Dashboard', { username, role });
      } else {
        Alert.alert('Error', data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('[Login] Exception during login:', err);
      Alert.alert('Error', 'Network error or server not reachable.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Username"
        value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password"
        value={password} onChangeText={setPassword} secureTextEntry />

      <View style={styles.roleContainer}>
        {['user', 'dasher'].map(r => (
          <TouchableOpacity key={r}
            style={[styles.roleButton, role === r && styles.roleButtonSelected]}
            onPress={() => setRole(r)}>
            <Text style={[styles.roleText, role === r && styles.roleTextSelected]}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Login" onPress={handleLogin} />
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f4f4f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 10, paddingLeft: 8, width: '100%' },
  roleContainer: { flexDirection: 'row', marginBottom: 20 },
  roleButton: {
    flex: 1, paddingVertical: 10, marginHorizontal: 5, borderWidth: 1,
    borderColor: '#999', borderRadius: 4, alignItems: 'center',
  },
  roleButtonSelected: { backgroundColor: '#007bff', borderColor: '#0056b3' },
  roleText: { color: '#333', fontSize: 16 },
  roleTextSelected: { color: 'white', fontWeight: 'bold' },
});

export default LoginScreen;
