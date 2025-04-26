// screen/BillScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function BillScreen({ route, navigation }) {
  const { request } = route.params;
  const est   = parseFloat(request.est_price || 0);
  const rate  = request.delivery_speed === 'urgent' ? 0.20 : 0.05;
  const fee   = est * rate;
  const total = est + fee;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Order Bill</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Items subtotal</Text>
        <Text>${est.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          Delivery fee ({request.delivery_speed})
        </Text>
        <Text>${fee.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>${total.toFixed(2)}</Text>
      </View>

      {/* 不再把确认逻辑写在这里，而是让用户去 TipScreen 决定是否给小费并自动确认 */}
      <Button
        title="Next — Choose Tip"
        onPress={() => {
          navigation.replace('TipScreen', {
            requestId: request.id,
            // 此处不再传递 onConfirmed: someFunction
          });
        }}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Cancel"
        color="#888"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, backgroundColor:'#fff' },
  heading:{ fontSize:22, fontWeight:'700', marginBottom:18, textAlign:'center' },
  row:{ flexDirection:'row', justifyContent:'space-between', marginVertical:6 },
  label:{ fontSize:16 },
  totalLabel:{ fontSize:18, fontWeight:'700' },
  total:{ fontSize:18, fontWeight:'700' },
});
