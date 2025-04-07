import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";

const CreateRequestScreen = ({ navigation }) => {
  const [item, setItem] = useState("");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState("common");

  const handleSubmit = async () => {
    if (!item || !dropOffLocation) {
      Alert.alert("Error", "Item and Drop-off Location cannot be empty!");
      return;
    }

    try {
      const response = await fetch("http://172.21.161.56/WesDashAPI/create_requests.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          item,
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
      <Text style={styles.label}>Item:</Text>
      <TextInput style={styles.input} value={item} onChangeText={setItem} />

      <Text style={styles.label}>Drop-off Location:</Text>
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
  label: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  radioGroup: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
});

export default CreateRequestScreen;
