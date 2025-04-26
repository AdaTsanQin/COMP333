import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function DropOffScreen({ route, navigation }) {
  const { requestId, sessionID, BASE_URL, refresh } = route.params;
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState(null);

  const choosePic = async () => {
    try{
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality:0.8
      });
      if (!res.canceled) setPhoto(res.assets?.[0] || null);
    }catch{ Alert.alert('Error','Could not open gallery.'); }
  };

  /* 提交 */
  const submit = async () => {
    const p = parseFloat(price);
    if(!(p>0)){ Alert.alert('Invalid','Enter a positive price'); return;}

    const form = new FormData();
    form.append('id', requestId);
    form.append('action','drop_off');
    form.append('real_price', p);
    if(photo){
      form.append('receipt',{
        uri:photo.uri,
        name:'receipt.jpg',
        type:'image/jpeg'
      });
    }

    try{
      const r = await fetch(`${BASE_URL}/accept_order.php`,{
        method:'POST',
        credentials:'include',
        headers:{ Cookie:`PHPSESSID=${sessionID}` },
        body:form
      });
      const d = await r.json();
      if(!d.success) return Alert.alert('Error',d.message||'Fail');
      Alert.alert('Success','Order dropped off!',[{text:'OK',onPress:()=>navigation.goBack()}]);
      refresh();            // 更新上一页列表
    }catch{ Alert.alert('Error','Network'); }
  };

  return(
    <View style={styles.c}>
      <Text style={styles.h}>Finish Delivery</Text>

      <Text style={styles.label}>Total price on receipt ($)</Text>
      <TextInput style={styles.inp}
        keyboardType={Platform.OS==='ios'?'decimal-pad':'numeric'}
        placeholder="e.g. 23.45" value={price} onChangeText={setPrice}/>

      <Button title="CHOOSE RECEIPT PHOTO (OPTIONAL)" onPress={choosePic}/>
      <View style={{height:10}}/>
      <Button title="SUBMIT" onPress={submit}/>
    </View>
  );
}

const styles = StyleSheet.create({
  c:{flex:1,padding:20},
  h:{fontSize:22,fontWeight:'700',textAlign:'center',marginBottom:20},
  label:{fontSize:16,fontWeight:'600',marginTop:14},
  inp:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:10,marginTop:6},
});
