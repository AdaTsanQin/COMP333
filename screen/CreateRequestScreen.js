import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateRequestScreen = ({ route, navigation }) => {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState("common");
  const [sessionID, setSessionID] = useState(null);

useEffect(() => {
  (async () => {
    const id = await AsyncStorage.getItem("PHPSESSID");
    if (!id) return Alert.alert("Error", "Session ID not found.");
    setSessionID(id);

    try {
      let resp = await fetch("http://10.0.2.2/WesDashAPI/get_wesshop_items.php", {
        headers: { "Cookie": `PHPSESSID=${id}` },
        credentials: "include"
      });
      let data = await resp.json();

      if (!data.success) {
        return Alert.alert("Error", "Failed to load items.");
      }

      const list = Array.isArray(data.items) ? data.items : [];
      setItems(list);

      if (list.length > 0) {
        setSelectedItem(list[0].name);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not load shop items.");
    }
  })();
}, []);



  const handleSubmit = async () => {
    if (!selectedItem || !dropOffLocation) {
      Alert.alert("Error", "Item and Drop-off Location cannot be empty!");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2/WesDashAPI/create_requests.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `PHPSESSID=${sessionID}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          item: selectedItem,
          quantity : parseInt(quantity,10),
          drop_off_location: dropOffLocation,
          delivery_speed: deliverySpeed,
        }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);

        if (response.ok && data.success) {
          Alert.alert("Success", data.success);
        } else {
          Alert.alert("Error", data.error || "Failed to create request.");
        }
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      console.error("Request failed", error);
      Alert.alert("Error", "Failed to create request. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
    <View style={styles.infoContainer}>
      <Text style={styles.infoText}>Logged in as: {username}</Text>
      <Text style={styles.infoText}>
        Role: {role === 'dasher' ? 'Dasher' : 'User'}
      </Text>
        </View>
      <Text style={styles.label}>Item:</Text>
            <Picker
              selectedValue={selectedItem}
              onValueChange={setSelectedItem}
            >
              {items.map(i => (
                <Picker.Item
                  key={i.id}
                  label={`${i.name} (In stock: ${i.number})`}
                  value={i.name}
                />
              ))}
            </Picker>

            <Text style={styles.label}>Quantity:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <Text style={styles.label}>Drop‑off Location:</Text>
            <TextInput
              style={styles.input}
              value={dropOffLocation}
              onChangeText={setDropOffLocation}
            />

      <Text style={styles.label}>Delivery Speed:</Text>
      <View style={styles.radioGroup}>
        <Button
          title="Urgent"
          onPress={() => setDeliverySpeed("urgent")}
          color={deliverySpeed === "urgent" ? "blue" : "gray"}
        />
        <Button
          title="Common"
          onPress={() => setDeliverySpeed("common")}
          color={deliverySpeed === "common" ? "blue" : "gray"}
        />
      </View>

      <Button title="Create Request" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  label: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10
  },
  infoContainer: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: '#eee',
      marginBottom: 12,
    },
});

export default CreateRequestScreen;
