import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function TipScreen({ route, navigation }) {
  const { requestId, onConfirmed } = route.params;
  const tipOptions = [5, 8, 10];

  const handleTip = async (percent) => {
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const res = await fetch(`${BASE_URL}/create_tip.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, percent }),
      });

      // 1) log status & headers
      console.log('create_tip status:', res.status);
      res.headers.forEach((val, key) => console.log('hdr', key, val));

      // 2) always read raw text
      const text = await res.text();
      console.log('create_tip response raw:', text);

      // 3) then parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON from server:\n' + text);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Tip failed');
      }

      // 4) open Stripe Checkout
      if (!data.sessionUrl) {
        throw new Error('Missing sessionUrl');
      }
      Linking.openURL(data.sessionUrl);

      // TIP: implement tip_success.php deep‐link back into your app
      // to call onConfirmed() and navigation.goBack()
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add a tip</Text>
      {tipOptions.map((p) => (
        <View key={p} style={styles.btnWrapper}>
          <Button title={`${p}%`} onPress={() => handleTip(p)} />
        </View>
      ))}
      <View style={styles.btnWrapper}>
        <Button
          title="No Tip — Just Confirm"
          color="#888"
          onPress={() => {
            onConfirmed();
            navigation.goBack();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 20, justifyContent: 'center' },
  heading:    { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  btnWrapper: { marginVertical: 8 },
});
