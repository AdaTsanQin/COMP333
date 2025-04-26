import React from 'react';
import { View, Text, Button, Alert, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function RechargeScreen({ navigation }) {
  const amounts = [100, 200, 500];        // 单位：美元 (根据需要改成分)

  const recharge = async (amt) => {
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const res = await fetch(`${BASE_URL}/add_balance.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json',
                   Cookie: `PHPSESSID=${sid}` },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Recharge failed');

      Alert.alert(
        'Success',
        `Balance updated!  New balance: $${(data.newBalance/100).toFixed(2)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recharge Balance</Text>
      {amounts.map((n) => (
        <View key={n} style={styles.btnWrapper}>
          <Button title={`+ $${n}`} onPress={() => recharge(n * 100)} />{/* 以分传给后端 */}
        </View>
      ))}
      <View style={styles.btnWrapper}>
        <Button title="Back" color="#888" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, justifyContent:'center', padding:20 },
  heading:    { fontSize:24, fontWeight:'bold', textAlign:'center', marginBottom:20 },
  btnWrapper: { marginVertical:8 }
});
