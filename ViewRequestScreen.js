import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, FlatList, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/accept_requests.php?PHPSESSID=${sessionId}` 
        : 'http://10.0.2.2/WesDashAPI/accept_requests.php';

      const response = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch requests.");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to fetch requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeleteRequest = async (id) => {
    try {
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/accept_requests.php?PHPSESSID=${sessionId}` 
        : 'http://10.0.2.2/WesDashAPI/accept_requests.php';
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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

  // Removed handleEditRequest since we're now using a separate screen for editing

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Requests</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <Text style={styles.emptyText}>No requests found.</Text>
      ) : (
        <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RequestItem 
            item={item} 
            onDelete={handleDeleteRequest}
            onNavigateToUpdate={() => navigation.navigate('UpdateRequestScreen', { requestId: item.id })} 
          />
        )}
      />
      )}
    </View>
  );
};

const RequestItem = ({ item, onDelete, onNavigateToUpdate }) => {
  return (
    <View style={styles.requestItem}>
      <Text style={styles.label}>Item Name:</Text>
      <Text style={styles.valueText}>{item.item}</Text>

      <Text style={styles.label}>Drop Off Location:</Text>
      <Text style={styles.valueText}>{item.drop_off_location}</Text>

      <Text style={styles.label}>Delivery Speed:</Text>
      <View style={styles.deliverySpeedContainer}>
        <Text style={[
          styles.deliverySpeedText, 
          item.delivery_speed === "urgent" ? styles.urgentText : styles.commonText
        ]}>
          {item.delivery_speed.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.label}>Status:</Text>
      <View style={[styles.statusContainer, item.status === "urgent" ? styles.urgent : styles.common]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button 
            title="Edit Request" 
            color="#007bff"
            onPress={onNavigateToUpdate} 
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Delete" color="#dc3545" onPress={() => onDelete(item.id)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  requestItem: { padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, backgroundColor: "#f8f8f8" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  valueText: { padding: 8, marginBottom: 5, backgroundColor: "#fff", borderRadius: 5, fontSize: 16 },
  
  // Delivery speed styling
  deliverySpeedContainer: { marginVertical: 5 },
  deliverySpeedText: { fontWeight: "bold", padding: 8, borderRadius: 5 },
  urgentText: { color: "#d9534f", backgroundColor: "#f9e6e5" },
  commonText: { color: "#5cb85c", backgroundColor: "#e7f4e7" },

  // Status display (non-editable)
  statusContainer: { padding: 8, borderRadius: 5, alignItems: "center", marginBottom: 5 },
  urgent: { backgroundColor: "#ff6666" },
  common: { backgroundColor: "#66cc66" },
  statusText: { fontWeight: "bold", color: "#fff" },
  buttonContainer: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  buttonWrapper: { flex: 1, marginHorizontal: 5 },
  buttonSpacer: { width: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555"
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: "#555",
    marginTop: 30
  },
});

export default ViewRequestsScreen;