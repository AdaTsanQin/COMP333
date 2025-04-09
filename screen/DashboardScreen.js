import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet,TextInput, Alert }  from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ route, navigation }) => {
  const { username, password } = route.params;
  const [showDeleteFields, setShowDeleteFields] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [confirmPasswordToDelete, setConfirmPasswordToDelete] = useState('');
  const [sessionID, setSessionID] = useState(null);
  useEffect(() => {
    const getSessionID = async () => {
      const id = await AsyncStorage.getItem("PHPSESSID");
      if (id) {
        setSessionID(id);
      } else {
        Alert.alert("Error", "Session ID not found. Please log in again.");
      }
    };
    getSessionID();
  }, []);
  const handleLogout = () => {
    navigation.navigate('Home');
  };
  const handleDeleteAccount = async () => {
      if (passwordToDelete !== confirmPasswordToDelete) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }

      try {
        const response = await fetch("http://10.0.2.2/WesDashAPI/delete_user.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordToDelete }),
          credentials: "include",
        });

        const data = await response.json();

        if (data.success) {
          Alert.alert("Account Deleted", "Your account has been deleted successfully.");
          navigation.navigate("Home");
        } else {
          Alert.alert("Error", data.message || "Failed to delete account.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to your dashboard!</Text>
      <Button title="Logout" onPress={handleLogout} />
      <Button title="Create Request" onPress={() => navigation.navigate('CreateRequestScreen')} />
      <Button title="View Request" onPress={() => navigation.navigate('ViewRequestScreen')} />
      <Button title="Accept Order" onPress={() => navigation.navigate('AcceptOrderScreen')} />
      <Button
        title="Delete Account"
        color="red"
        onPress={() => setShowDeleteFields(!showDeleteFields)}
      />

      {showDeleteFields && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            secureTextEntry
            value={passwordToDelete}
            onChangeText={setPasswordToDelete}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPasswordToDelete}
            onChangeText={setConfirmPasswordToDelete}
          />
          <Button title="Confirm Deletion" onPress={handleDeleteAccount} color="red" />
        </>
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
});

export default DashboardScreen;
