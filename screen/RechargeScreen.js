import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';
import { BASE_URL } from './config';

export default function RechargeScreen({ navigation }) {
  const amounts = [100, 200, 500]; // dollars
  const { initPaymentSheet, presentPaymentSheet, handleURLCallback } = useStripe();
  const [loading, setLoading] = useState(false);

  // Handle deep link if redirected from browser-based authentication
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const handled = await handleURLCallback(event.url);
      if (!handled) {
        console.warn('[Stripe] Unhandled URL:', event.url);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [handleURLCallback]);

  const fetchPaymentIntent = async (amt) => {
    const res = await fetch(`${BASE_URL}/create-payment-intent.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount: amt * 100 }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON: ${text}`);
    }
  };

  const openPaymentSheet = async (amt) => {
    setLoading(true);
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');

      if (!sid || !/^[a-zA-Z0-9-_]{1,128}$/.test(sid)) {
        Alert.alert('Error', 'Invalid session ID. Please log in again.');
        return;
      }

      const { clientSecret, error } = await fetchPaymentIntent(amt);
      if (error) throw new Error(error);

      const initRes = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'WesDash',
        returnURL: 'wesdash://stripe-redirect', //matches deep link scheme
      });
      if (initRes.error) throw new Error(initRes.error.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);

      const res2 = await fetch(`${BASE_URL}/add_balance.php?PHPSESSID=${sid}`, {
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
        `Charged $${amt.toFixed(2)}! New balance: $${(data2.newBalance / 100).toFixed(2)}`,
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
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  heading: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  btnWrapper: { marginVertical: 8 },
});
