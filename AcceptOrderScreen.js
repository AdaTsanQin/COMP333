import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, FlatList } from "react-native";

const AcceptOrderScreen = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://129.133.74.116/WesDashAPI/accept_order.php", {
        method: "GET",
        credentials: "include", 
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      console.log("GET response status:", response.status);
      const data = await response.json();
      console.log("GET response data:", data);

      if (data.success) {
        setOrders(data.orders);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch orders.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to fetch orders. Please try again.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAcceptOrder = async (id) => {
    try {
      const response = await fetch("http://129.133.74.116/WesDashAPI/accept_order.php", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      console.log("PUT response data:", data);

      if (data.success) {
        Alert.alert("Success", "Order accepted successfully!");
        fetchOrders();  
      } else {
        Alert.alert("Error", data.message || "Failed to accept order.");
      }
    } catch (error) {
      console.error("Accept order error:", error);
      Alert.alert("Error", "Failed to accept order. Please try again.");
    }
  };

  const OrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.label}>Item Name:</Text>
      <Text style={styles.text}>{item.item}</Text>

      <Text style={styles.label}>Drop Off Location:</Text>
      <Text style={styles.text}>{item.drop_off_location}</Text>

      <Text style={styles.label}>Delivery Speed:</Text>
      <Text style={styles.text}>{item.delivery_speed}</Text>

      <Text style={styles.label}>Status:</Text>
      <View style={[
        styles.statusContainer,
        item.status === "pending" ? styles.pending : styles.accepted
      ]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>

      {item.status === "pending" && (
        <Button title="Accept" onPress={() => handleAcceptOrder(item.id)} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pending Orders (Others Only)</Text>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id.toString()}
        renderItem={({ item }) => <OrderItem item={item} />}
      />
    </View>
  );
};

export default AcceptOrderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff"
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  orderItem: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f8f8f8"
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5
  },
  text: {
    fontSize: 16,
    marginBottom: 5
  },
  statusContainer: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 5
  },
  pending: {
    backgroundColor: "#ffcc00"
  },
  accepted: {
    backgroundColor: "#66cc66"
  },
  statusText: {
    fontWeight: "bold",
    color: "#fff"
  }
});