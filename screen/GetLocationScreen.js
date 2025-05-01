import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import * as Location from 'expo-location';
import { BASE_URL } from './config';

const GetLocationScreen = () => {
  const [location, setLocation] = useState(null);

  const getLocation = async () => {
    // 1) ask permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    // 2) get the current position
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 10000,
        timeout: 15000,
      });
      console.log('Got location:', loc);
      setLocation(loc);
    } catch (error) {
      console.log('Error fetching location:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Welcome!</Text>
      <View style={styles.button}>
        <Button title="Get Location" onPress={getLocation} />
      </View>
      <Text>Latitude:  {location?.coords.latitude ?? 'n/a'}</Text>
      <Text>Longitude: {location?.coords.longitude ?? 'n/a'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center' },
  button:    { marginTop:10, width:'60%' },
});

export default GetLocationScreen;
