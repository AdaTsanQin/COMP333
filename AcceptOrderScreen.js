 import React, { useEffect, useState } from "react";
 import { View, Text, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from "react-native";

 const AcceptOrderScreen = () => {
   const [orders, setOrders] = useState([]);

   const fetchOrders = async () => {
     try {
       const response = await fetch("http://172.21.161.56/WesDashAPI/accept_order.php", {
         method: "GET",
         credentials: "include",
         headers: { "Accept": "application/json", "Content-Type": "application/json" }
       });

       console.log("Response status:", response.status);  // Log HTTP status
       const data = await response.json();
       console.log("Response data:", data);  // Log actual response

       if (data.success) {
         setOrders(data.requests);
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
       const response = await fetch("http://172.21.161.56/WesDashAPI/accept_order.php", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ id, status: "accepted" }),
         credentials: "include",
       });

       const data = await response.json();
       if (data.success) {
         Alert.alert("Success", "Order accepted successfully!");
         fetchOrders();
       } else {
         Alert.alert("Error", data.message || "Failed to accept order.");
       }
     } catch (error) {
       Alert.alert("Error", "Failed to accept order. Please try again.");
     }
   };

   return (
     <View style={styles.container}>
       <Text style={styles.heading}>Pending Orders</Text>
       <FlatList
         data={orders}
         keyExtractor={(item) => item.id.toString()}
         renderItem={({ item }) => <OrderItem item={item} onAccept={handleAcceptOrder} />}
       />
     </View>
   );
 };

 const OrderItem = ({ item, onAccept }) => (
   <View style={styles.orderItem}>
     <Text style={styles.label}>Item Name:</Text>
     <Text style={styles.text}>{item.item}</Text>

     <Text style={styles.label}>Drop Off Location:</Text>
     <Text style={styles.text}>{item.drop_off_location}</Text>

     <Text style={styles.label}>Delivery Speed:</Text>
     <Text style={styles.text}>{item.delivery_speed}</Text>

     <Text style={styles.label}>Status:</Text>
     <View style={[styles.statusContainer, item.status === "pending" ? styles.pending : styles.accepted]}>
       <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
     </View>

     {item.status === "pending" && (
       <Button title="Accept" onPress={() => onAccept(item.id)} />
     )}
   </View>
 );

 const styles = StyleSheet.create({
   container: { flex: 1, padding: 16, backgroundColor: "#fff" },
   heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
   orderItem: { padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, backgroundColor: "#f8f8f8" },
   label: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
   text: { fontSize: 16, marginBottom: 5 },
   statusContainer: { padding: 8, borderRadius: 5, alignItems: "center", marginBottom: 5 },
   pending: { backgroundColor: "#ffcc00" }, // Yellow for pending
   accepted: { backgroundColor: "#66cc66" }, // Green for accepted
   statusText: { fontWeight: "bold", color: "#fff" },
 });

 export default AcceptOrderScreen;
