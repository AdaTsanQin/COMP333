// screen/DashboardScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DashboardScreen = ({ route, navigation }) => {
  const { username, password, role: initialRole } = route.params || {};
  const [currentRole, setCurrentRole] = useState(initialRole || "user");
  const [showDeleteFields, setShowDeleteFields] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState("");
  const [confirmPasswordToDelete, setConfirmPasswordToDelete] = useState("");
  const [sessionID, setSessionID] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("PHPSESSID");
      if (id) setSessionID(id);
      else Alert.alert("Error", "Session ID not found. Please log in again.");
    })();
  }, []);

  const handleLogout = () => navigation.navigate("Home");

  const handleDeleteAccount = async () => {
    if (passwordToDelete !== confirmPasswordToDelete) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      const resp = await fetch("http://10.0.2.2/WesDashAPI/delete_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordToDelete }),
        credentials: "include",
      });
      const data = await resp.json();
      if (data.success) {
        Alert.alert("Account Deleted", "Your account has been deleted successfully.");
        navigation.navigate("Home");
      } else Alert.alert("Error", data.message || "Failed to delete account.");
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {username || "User"}!</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.infoText}>Role: {currentRole}</Text>
        <Switch
          value={currentRole === "dasher"}
          onValueChange={(isDasher) => setCurrentRole(isDasher ? "dasher" : "user")}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        {/* chat */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Chats", { username, role: currentRole })}
        >
          <Text style={styles.buttonText}>Chat Rooms</Text>
        </TouchableOpacity>

        {currentRole === "user" && (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate("CreateRequestScreen", { username, role: currentRole })
              }
            >
              <Text style={styles.buttonText}>Create Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate("ViewRequestScreen", { username, role: currentRole })
              }
            >
              <Text style={styles.buttonText}>View Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate("SearchScreen", { username, role: currentRole })
              }
            >
              <Text style={styles.buttonText}>Items from Nearby Stores</Text>
            </TouchableOpacity>
          </>
        )}

        {currentRole === "dasher" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("AcceptOrderScreen", { username, role: currentRole })
            }
          >
            <Text style={styles.buttonText}>Accept Order</Text>
          </TouchableOpacity>
        )}

        {/* delete account */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ff6666" }]}
          onPress={() => setShowDeleteFields(!showDeleteFields)}
        >
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>

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
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#ff6666" }]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.buttonText}>Confirm Deletion</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f4f4f9" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#555" },
  infoText: { fontSize: 16, marginBottom: 8, color: "#333" },
  toggleRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  buttonContainer: { width: "100%", alignItems: "center", marginTop: 10 },
  button: {
    width: "80%",
    backgroundColor: "#007bff",
    padding: 10,
    marginVertical: 6,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
});

export default DashboardScreen;
