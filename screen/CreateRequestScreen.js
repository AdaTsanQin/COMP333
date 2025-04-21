import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, Image } from "react-native";

const CreateRequestScreen = ({ navigation, route }) => {
  // Check if product data was passed from SearchScreen
  const productData = route.params?.productData;
  
  const [item, setItem] = useState(productData?.item_name || "");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState("common");
  const [productImage, setProductImage] = useState(productData?.image_url || null);

  const handleSubmit = async () => {
    if (!item || !dropOffLocation) {
      Alert.alert("Error", "Item and Drop-off Location cannot be empty!");
      return;
    }

    try {
      // Prepare request data, including product_id if available
      const requestData = {
        item,
        drop_off_location: dropOffLocation,
        delivery_speed: deliverySpeed,
      };
      
      // Add product_id if it was provided from the SearchScreen
      if (productData?.product_id) {
        requestData.product_id = productData.product_id;
      }
      
      // Add image_url if available
      if (productImage) {
        requestData.image_url = productImage;
      }

      const response = await fetch("http://10.0.2.2/WesDashAPI/create_requests.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      let data = await resp.json();

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);

        if (response.ok && data.success) {
          // Get the route params from the current screen that might have the username and role
          const { username, role } = route.params || {};
          
          Alert.alert("Success", data.success, [
            {
              text: "OK",
              onPress: () => {
                // If we have username and role, pass them back to Dashboard
                if (username && role) {
                  navigation.navigate("Dashboard", { username, role });
                } else {
                  navigation.navigate("Dashboard");
                }
              }
            }
          ]);
        } else {
          Alert.alert("Error", data.error || "Failed to create request.");
        }
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        Alert.alert("Error", "Unexpected response from server.");
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

  const selectedItemDetails = items.find(item => item.name === selectedItem);
  const requestedQuantity = parseInt(quantity, 10);

  // Check if the requested quantity exceeds available stock
  if (selectedItemDetails && requestedQuantity > selectedItemDetails.number) {
    Alert.alert(
      "Alert",
      "Your current request is larger than the storage, may be pending for a long time until the storage of the shop increases.",
      [
        {
          text: "Proceed Anyway",
          onPress: async () => {
            await createOrder();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  } else {
    await createOrder();
  }
};

const createOrder = async () => {
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
        quantity: parseInt(quantity, 10),
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
  const handleMapPress = (e) => {
    const coordinate = e.nativeEvent.coordinate;
    setMarker(coordinate);
    setDropOffLocation(`${coordinate.latitude}, ${coordinate.longitude}`);
  };
  return (
    <View style={styles.container}>
      {/* Show product image if available */}
      {productImage && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: productImage }} 
            style={styles.productImage} 
            resizeMode="contain"
          />
          {productData?.product_id && (
            <Text style={styles.productId}>Product ID: {productData.product_id}</Text>
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
        placeholder="Enter delivery location (e.g., Fauver, Butts, Clark)"
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
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}  // Use OSM provider
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title="Drop-off Location"
            description="This is the location you selected."
          />
        )}
      </MapView>
      <Button title="Create Request" onPress={handleSubmit} />

      <View style={styles.buttonContainer}>
        <Button 
          title="Create Request" 
          onPress={handleSubmit} 
          color="#3498db"
        />
      </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#fff" 
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  productImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  productId: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  label: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 10 
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
    marginVertical: 15 
  },
  infoContainer: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: '#eee',
      marginBottom: 12,
    },
  map: {
    width: '100%',
    height: 200,
    marginTop: 20,
  },
  scrollView: {
     flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: 20,
  }
});

export default CreateRequestScreen;