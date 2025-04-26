// screen/DropOffScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function DropOffScreen({ route, navigation }) {
  const { orderId, onDone } = route.params;          // ← 接单页传进来的

  const [price, setPrice]         = useState('');
  const [receiptUri, setReceipt]  = useState(null);
  const [hasLibPerm, setPerm]     = useState(false);

  /* ─── 请求图库权限 ─── */
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPerm(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission required',
          'To attach a receipt you need to allow photo library access.');
      }
    })();
  }, []);

  /* ─── 选图片 ─── */
  const pickReceipt = async () => {
    if (!hasLibPerm) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled) {
        setReceipt(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  /* ─── 提交 ─── */
  const handleSubmit = () => {
    const p = parseFloat(price);
    if (!(p > 0)) {
      Alert.alert('Invalid', 'Please enter a positive price.'); return;
    }
    // 把数据回传给上一页 (或直接上传后台，看你的 AcceptOrderScreen 实现)
    onDone({ orderId, price: p, receiptUri });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Finish Delivery</Text>

      <Text style={styles.label}>Total price on receipt ($)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="e.g. 23.45"
      />

      <Button
        title="CHOOSE RECEIPT PHOTO (OPTIONAL)"
        onPress={pickReceipt}
        disabled={!hasLibPerm}
      />

      {receiptUri && (
        <Image source={{ uri: receiptUri }} style={styles.preview} />
      )}

      <View style={{ height: 10 }} />

      <Button title="SUBMIT" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20 },
  heading:{ fontSize:24, fontWeight:'700', textAlign:'center', marginBottom:24 },
  label:{ fontSize:16, marginBottom:6 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6,
          padding:10, marginBottom:16 },
  preview:{ width:'100%', height:200, marginTop:12, borderRadius:6 },
});
