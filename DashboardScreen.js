import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to your dashboard!</Text>
      <Button title="Logout" onPress={handleLogout} />
      <Button title="Create Request" onPress={() => navigation.navigate('CreateRequestScreen')} />
      <Button title="View Request" onPress={() => navigation.navigate('ViewRequestScreen')} />
      <Button title="Accept Order" onPress={() => navigation.navigate('AcceptOrderScreen')} />
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
});

export default DashboardScreen;