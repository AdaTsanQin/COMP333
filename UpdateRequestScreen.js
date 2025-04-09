import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView 
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const UpdateRequestScreen = ({ route, navigation }) => {
  const { requestId } = route.params || {};
  const [item, setItem] = useState("");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState("common");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the request details when the component mounts
    if (requestId) {
      fetchRequestDetails();
    } else {
      setLoading(false);
      Alert.alert("Error", "No request ID provided");
      navigation.goBack();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/request_details.php?PHPSESSID=${sessionId}&request_id=${requestId}` 
        : `http://10.0.2.2/WesDashAPI/request_details.php?request_id=${requestId}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);
        
        if (data.success) {
          // Set the form fields with the request's current values
          setItem(data.request.item || "");
          setDropOffLocation(data.request.drop_off_location || "");
          setDeliverySpeed(data.request.delivery_speed || "common");
        } else {
          Alert.alert("Error", data.message || "Failed to fetch request details");
          navigation.goBack();
        }
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        Alert.alert("Error", "Unexpected response from server");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Fetch request failed", error);
      Alert.alert("Error", "Failed to fetch request details. Please try again.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!item || !dropOffLocation) {
      Alert.alert("Error", "Item and Drop-off Location cannot be empty!");
      return;
    }

    try {
      setLoading(true);
      
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/update_request.php?PHPSESSID=${sessionId}` 
        : `http://10.0.2.2/WesDashAPI/update_request.php`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          request_id: requestId,
          item,
          drop_off_location: dropOffLocation,
          delivery_speed: deliverySpeed,
        }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);

        if (data.success) {
          Alert.alert(
            "Success", 
            "Request updated successfully",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("ViewRequestScreen")
              }
            ]
          );
        } else {
          Alert.alert("Error", data.message || "Failed to update request.");
        }
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      console.error("Request failed", error);
      Alert.alert("Error", "Failed to update request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Request #{requestId}</Text>
      
      <Text style={styles.label}>Item:</Text>
      <TextInput 
        style={styles.input} 
        value={item} 
        onChangeText={setItem}
        placeholder="Enter item description" 
      />

      <Text style={styles.label}>Drop-off Location:</Text>
      <TextInput
        style={styles.input}
        value={dropOffLocation}
        onChangeText={setDropOffLocation}
        placeholder="Enter drop-off location"
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
        <Button title="Update Request" onPress={handleSubmit} />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Cancel" 
          onPress={() => navigation.goBack()} 
          color="gray" 
        />
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  label: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginTop: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    marginBottom: 15,
    borderRadius: 5,
  },
  radioGroup: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    marginVertical: 15 
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonSpacer: {
    height: 10
  }
});

export default UpdateRequestScreen;