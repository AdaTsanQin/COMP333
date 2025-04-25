// screen/CreateStoreRequestScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Image,
} from "react-native";

const CreateStoreRequestScreen = ({ navigation, route }) => {
  // If you came via SearchScreen you might have productData
  const productData = route.params?.productData ?? {};

  const [item, setItem]                     = useState(productData.item_name || "");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [deliverySpeed, setDeliverySpeed]   = useState("common");
  const [productImage]                      = useState(productData.image_url || null);

  // ── 1) This helper actually does the POST ────────────────────────
  const proceedStoreRequest = async () => {
    try {
      // --- compute prices ---
      // per-unit price from productData (default to 0 if missing)
      const estPrice = parseFloat(productData.price) || 0.00;
      // for a single-item store request, total = estPrice * 1
      const totalPrice = parseFloat((estPrice * 1).toFixed(2));

      const requestData = {
        item,
        drop_off_location: dropOffLocation,
        delivery_speed: deliverySpeed,
        est_price: estPrice,       // new
        total_price: totalPrice    // new
      };

      if (productData.product_id) {
        requestData.product_id = productData.product_id;
      }
      if (productImage) {
        requestData.image_url = productImage;
      }

      const response = await fetch(
        "http://10.0.2.2/WesDashAPI/create_requests.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      const text = await response.text();
      console.log("Raw response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return Alert.alert("Error", "Unexpected response from server.");
      }

      if (response.ok && data.success) {
        const { username, role } = route.params || {};
        Alert.alert("Success", data.success, [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate(
                "Dashboard",
                username && role ? { username, role } : {}
              ),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to create request.");
      }
    } catch (error) {
      console.error("Request failed", error);
      Alert.alert("Error", "Failed to create request. Please try again.");
    }
  };

  // ── 2) Main submit handler shows fee alert ───────────────────────
  const handleSubmit = () => {
    if (!item.trim() || !dropOffLocation.trim()) {
      return Alert.alert(
        "Error",
        "Item and Drop-off Location cannot be empty!"
      );
    }

    const feeRate = deliverySpeed === "common" ? 0.05 : 0.20;
    Alert.alert(
      "Delivery Fee",
      `You selected ${deliverySpeed.toUpperCase()} delivery. A ${
        feeRate * 100
      }% fee will be applied.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: proceedStoreRequest },
      ]
    );
  };

  // ── 3) UI ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {productImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {productData.product_id && (
            <Text style={styles.productId}>
              Product ID: {productData.product_id}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.label}>Item:</Text>
      <TextInput
        style={styles.input}
        value={item}
        onChangeText={setItem}
        placeholder="Enter item name"
      />

      <Text style={styles.label}>Drop-off Location:</Text>
      <TextInput
        style={styles.input}
        value={dropOffLocation}
        onChangeText={setDropOffLocation}
        placeholder="e.g. Fauver, Butts, Clark"
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

      <View style={styles.buttonContainer}>
        <Button
          title="Create Request"
          onPress={handleSubmit}
          color="#3498db"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  productImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  productId: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
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
    marginVertical: 15,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default CreateStoreRequestScreen;

