// screen/TipScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function TipScreen({ route, navigation }) {
  const { requestId } = route.params;

  const [loading,  setLoading ] = useState(true);
  const [estPrice, setEstPrice] = useState(0);
  const [speed,    setSpeed   ] = useState('common');

  /* ───────────── 账单 ───────────── */
  const deliveryFee = +(estPrice * (speed === 'urgent' ? 0.20 : 0.05)).toFixed(2);
  const subTotal    = +(estPrice + deliveryFee).toFixed(2);

  /* ─────────── 拉订单信息 ─────────── */
  useEffect(() => {
    (async () => {
      try {
        const sid = await AsyncStorage.getItem('PHPSESSID');
        const r   = await fetch(`${BASE_URL}/get_request.php?id=${requestId}`, {
          headers:   { Cookie: `PHPSESSID=${sid}` },
          credentials: 'include',
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Load failed');

        setEstPrice(parseFloat(d.request.est_price || 0));
        setSpeed(d.request.delivery_speed || 'common');
      } catch (e) {
        Alert.alert('Error', e.message || 'Network error', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, navigation]);

  /* ─────────── 确认订单 ─────────── */
  const confirmOrder = async () => {
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      await fetch(`${BASE_URL}/accept_requests.php`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sid}`,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
    } finally {
      navigation.navigate('Dashboard');
    }
  };

  /* ─────────── 加 / 不加 小费 共用逻辑 ─────────── */
  const handleTip = async (percent) => {
    setLoading(true);
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const res = await fetch(`${BASE_URL}/create_tip.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sid}`,
        },
        body: JSON.stringify({ request_id: requestId, percent }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || 'Tip failed');

      /* tip / 无 tip 扣款成功 → 立即确认订单 */
      await confirmOrder();

      Alert.alert(
        'Success',
        `Order confirmed!\nNew balance: $${(d.newBalance / 100).toFixed(2)}`
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── 无小费按钮 ─────────── */
  const handleNoTip = () => handleTip(0);     // ← 关键修改：percent = 0

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ─────────── UI ─────────── */
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Order Bill</Text>

      <View style={styles.billRow}>
        <Text style={styles.billLbl}>Items:</Text>
        <Text style={styles.billVal}>${estPrice.toFixed(2)}</Text>
      </View>

      <View style={styles.billRow}>
        <Text style={styles.billLbl}>Delivery fee:</Text>
        <Text style={styles.billVal}>${deliveryFee.toFixed(2)}</Text>
      </View>

      <View style={[styles.billRow, { borderTopWidth: 1, marginTop: 6 }]}>
        <Text style={[styles.billLbl, { fontWeight: '700' }]}>Subtotal:</Text>
        <Text style={[styles.billVal, { fontWeight: '700' }]}>
          ${subTotal.toFixed(2)}
        </Text>
      </View>

      <Text style={[styles.heading, { marginTop: 26 }]}>Add a tip?</Text>

      {[5, 8, 10].map((p) => (
        <View key={p} style={styles.btnWrapper}>
          <Button title={`${p}% TIP`} onPress={() => handleTip(p)} />
        </View>
      ))}

      <View style={styles.btnWrapper}>
        <Button
          title="CONFIRM (NO TIP)"
          color="#888"
          onPress={handleNoTip}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 20 },
  heading:    { fontSize: 22, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  billRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billLbl:    { fontSize: 16 },
  billVal:    { fontSize: 16 },
  btnWrapper: { marginVertical: 8 },
});
