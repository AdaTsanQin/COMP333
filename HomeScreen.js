import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

  // Example of checking if user is logged in
  const isLoggedIn = false; // This should be dynamically checked from your state or AsyncStorage

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to WesDash</Text>
      <Text style={styles.subtitle}>Your ultimate order management platform</Text>

      {isLoggedIn ? (
        <View style={styles.buttonContainer}>
          <Button
            title="Go to Dashboard"
            onPress={() => navigation.navigate('Dashboard')} // Navigate to Dashboard
          />
          <Button
            title="Logout"
            onPress={() => navigation.navigate('Login')} // Logout logic here
          />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={() => navigation.navigate('Login')} // Navigate to login screen
          />
          <Button
            title="Register"
            onPress={() => navigation.navigate('Register')} // Navigate to register screen
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
