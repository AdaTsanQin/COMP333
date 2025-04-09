import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State for logged-in status
  const isLoggedIn = false;
  useEffect(() => {
    const checkLoginStatus = async () => {
      const sessionId = await AsyncStorage.getItem("PHPSESSID");
      if (sessionId) {
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  const isLoggedIn = false;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to WesDash</Text>
      <Text style={styles.subtitle}>Your ultimate order management platform</Text>

      {isLoggedIn ? (
        <View style={styles.buttonContainer}>
          <Button
            title="Go to Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
          />
          <Button
            title="Logout"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={() => navigation.navigate('Login')} 
          />
          <Button
            title="Register"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    padding: 10,
  },
});

export default HomeScreen;
