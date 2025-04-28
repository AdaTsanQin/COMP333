import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, Alert, Platform } from 'react-native';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function PriceReceiptScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* 选取图片 */
  const pickImage = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      quality: 0.7,
      base64: true   // 直接转 base64，省去文件上传
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  /* 提交 */
  const submit = async () => {
    const val = parseFloat(price);
    if (!val || val<=0) { Alert.alert('Enter valid price'); return; }
    if (!photo)        { Alert.alert('Select receipt photo'); return; }

    try {
      setUploading(true);
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const r = await fetch(`${BASE_URL}/upload_receipt.php`,{
        method:'POST',
        headers:{ 'Content-Type':'application/json', Cookie:`PHPSESSID=${sid}` },
        credentials:'include',
        body: JSON.stringify({
          order_id: orderId,
          est_price: val,
          image_base64: photo.base64
        })
      });
      const d = await r.json();
      if (d.success) {
        Alert.alert('Success','Receipt saved. Order completed!',[
          {text:'OK',onPress:()=>navigation.goBack()}
        ]);
      } else Alert.alert('Error', d.message || 'Server error');
    } catch { Alert.alert('Error','Network error'); }
    finally { setUploading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Finish Order</Text>

      <Text style={styles.label}>Actual total price ($):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        placeholder="e.g. 23.45"
      />

      {photo && (
        <Image source={{uri:photo.uri}} style={{width:'100%',height:220,marginVertical:10}}/>
      )}
      <Button title="Select Receipt Photo" onPress={pickImage}/>

      <View style={{height:12}}/>
      <Button title={uploading?'Uploading...':'Submit'} onPress={submit} disabled={uploading}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,backgroundColor:'#fff'},
  heading:{fontSize:24,fontWeight:'700',textAlign:'center',marginBottom:20},
  label:{fontSize:16,fontWeight:'600',marginTop:10},
  input:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:10,fontSize:16,marginTop:6}
});
