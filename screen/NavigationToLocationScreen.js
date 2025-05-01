import React from "react";
import {
  View,
  Button,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Linking } from "react-native";
import { BASE_URL } from './config';

const NavigationToLocation = ({ route, navigation }) => {
  const { dropOffLocation } = route.params;
  // “12.3456, -78.9012”
  const [lat, lng] = dropOffLocation
    .split(",")
    .map((s) => parseFloat(s.trim()));

  const startNavigation = () => {
    const url = Platform.select({
      ios: `maps://?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) =>
      Alert.alert("Error", "Could not open maps: " + err)
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title="Drop‑off"
        />
      </MapView>
      <View style={styles.buttonWrapper}>
        <Button title="Start Navigation" onPress={startNavigation} />
              <View style={styles.backButton}>
                <Button
                  title="Back to Dashboard"
                  onPress={() => navigation.goBack()}
                />
              </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    marginTop: 10,
  },
});

export default NavigationToLocation;

