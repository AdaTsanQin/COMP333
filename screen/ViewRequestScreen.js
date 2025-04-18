import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewRequestsScreen = ({ route, navigation }) => {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};
  const [requests, setRequests] = useState([]);
  const [sessionID, setSessionID] = useState(null);

  const fetchRequests = async () => {
    try {
      const response = await fetch("http://10.0.2.2/WesDashAPI/accept_requests.php", {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Cookie": `PHPSESSID=${sessionID}`, // Include the session ID in the request
        }
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch requests.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch requests. Please try again.");
    }
  };

  useEffect(() => {
    const getSessionID = async () => {
      const id = await AsyncStorage.getItem("PHPSESSID");
      if (id) {
        setSessionID(id);
        fetchRequests(); // Fetch requests after setting session ID
      } else {
        Alert.alert("Error", "Session ID not found. Please log in again.");
      }
    };
    fetchRequests();
    getSessionID();
  }, []);

  const handleDeleteRequest = async (id) => {
    try {
      const response = await fetch("http://10.0.2.2/WesDashAPI/accept_requests.php", {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        "Cookie": `PHPSESSID=${sessionID}`,},
        body: JSON.stringify({ delete_id: id }),
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", data.message);
        fetchRequests();
      } else {
        Alert.alert("Error", data.message || "Failed to delete request.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete request. Please try again.");
    }
  };

  const handleEditRequest = async (id, item, dropOffLocation, deliverySpeed, status) => {
    try {
      const response = await fetch("http://10.0.2.2/WesDashAPI/edit.php", {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "Cookie": `PHPSESSID=${sessionID}`,},
        body: JSON.stringify({ id, item, drop_off_location: dropOffLocation, delivery_speed: deliverySpeed, status }),
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", data.message);
        fetchRequests();
      } else {
        Alert.alert("Error", data.message || "Failed to edit request.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to edit request. Please try again.");
    }
  };
  const handleConfirmRequest = async (id) => {
  try {
    const response = await fetch("http://10.0.2.2/WesDashAPI/accept_requests.php", {
      method: "PUT",
      headers: {
      "Content-Type": "application/json",
      "Cookie": `PHPSESSID=${sessionID}`,},
      body: JSON.stringify({ request_id: id }), 
      credentials: "include",
    });

    const data = await response.json();
    if (data.success) {
      Alert.alert("Success", data.message || "Request accepted!");
      fetchRequests(); // refresh the list
    } else {
      Alert.alert("Error", data.message || "Failed to accept request.");
    }
  } catch (error) {
    Alert.alert("Error", "Network error while accepting request.");
   }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Logged in as: {username}</Text>
      <Text style={styles.infoText}>
        Role: {role === 'dasher' ? 'Dasher' : 'User'}
      </Text>
      <Text style={styles.heading}>All Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RequestItem
              item={item}
              onEdit={handleEditRequest}
              onDelete={handleDeleteRequest}
              onConfirm={handleConfirmRequest}
            />
          )}
      />
    </View>
  );
};

const RequestItem = ({ item, onEdit, onDelete, onConfirm }) => {
  const [itemText, setItemText] = useState(item.item);
  const [dropOffText, setDropOffText] = useState(item.drop_off_location);
  const [deliverySpeed, setDeliverySpeed] = useState(item.delivery_speed);

  return (
    <View style={styles.requestItem}>
      <Text style={styles.label}>Item Name:</Text>
      <TextInput style={styles.input} value={itemText} onChangeText={setItemText} />

      <Text style={styles.label}>Drop Off Location:</Text>
      <TextInput style={styles.input} value={dropOffText} onChangeText={setDropOffText} />

      <Text style={styles.label}>Delivery Speed:</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={[styles.radioButton, deliverySpeed === "urgent" && styles.selectedButton]}
          onPress={() => setDeliverySpeed("urgent")}
        >
          <Text style={styles.radioText}>Urgent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, deliverySpeed === "common" && styles.selectedButton]}
          onPress={() => setDeliverySpeed("common")}
        >
          <Text style={styles.radioText}>Common</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Status:</Text>
      <View style={[styles.statusContainer, item.status === "urgent" ? styles.urgent : styles.common]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>

      <Button title="Confirm Edit" onPress={() => onEdit(item.id, itemText, dropOffText, deliverySpeed, item.status)} />
        {item.status === "completed" && (
           <Button title="Confirm Order" onPress={() => onConfirm(item.id)} />
        )}
       <Button title="Delete" onPress={() => onDelete(item.id)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  requestItem: { padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, backgroundColor: "#f8f8f8" },
  input: { borderWidth: 1, padding: 5, marginBottom: 5, borderRadius: 5, backgroundColor: "#fff" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 5 },

  // Radio button group styling
  radioGroup: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  radioButton: { padding: 10, borderWidth: 1, borderColor: "#333", borderRadius: 5, minWidth: 100, alignItems: "center" },
  selectedButton: { backgroundColor: "#007bff" },
  radioText: { fontWeight: "bold", color: "#333" },
  selectedText: { color: "#fff" },

  // Status display (non-editable)
  statusContainer: { padding: 8, borderRadius: 5, alignItems: "center", marginBottom: 5 },
  urgent: { backgroundColor: "#ff6666" },
  common: { backgroundColor: "#66cc66" },
  statusText: { fontWeight: "bold", color: "#fff" },
});

export default ViewRequestsScreen;