// app/screens/RechargeScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function RechargeScreen({ navigation }) {
  const amounts = [100, 200, 500];  // dollars
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // 1) Hit your new endpoint for a PaymentIntent
  const fetchPaymentIntent = async (amt) => {
    const res = await fetch(`${BASE_URL}/create-payment-intent.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt * 100 }), // to cents
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON: ${text}`);
    }
  };

  // 2) Show Stripe’s payment sheet, then bump your balance
  const openPaymentSheet = async (amt) => {
    setLoading(true);
    try {
      const { clientSecret, error } = await fetchPaymentIntent(amt);
      if (error) throw new Error(error);

      const initRes = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'WesDash',
      });
      if (initRes.error) throw new Error(initRes.error.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);

      // Payment succeeded → call your existing PHP to update balance
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const res2 = await fetch(`${BASE_URL}/add_balance.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sid}`,
        },
        body: JSON.stringify({ amount: amt * 100 }),
      });
      const data2 = await res2.json();
      if (!data2.success) throw new Error(data2.error || 'Balance update failed');

      Alert.alert(
        'Success',
        `Charged $${amt.toFixed(2)}! New balance: $${(data2.newBalance/100).toFixed(2)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recharge Balance</Text>
      {amounts.map((n) => (
        <View key={n} style={styles.btnWrapper}>
          <Button
            title={`+ $${n}`}
            onPress={() => openPaymentSheet(n)}
            disabled={loading}
          />
        </View>
      ))}
      <View style={styles.btnWrapper}>
        <Button
          title="Back"
          color="#888"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 20 },
  heading:    { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  btnWrapper: { marginVertical: 8 },
});
