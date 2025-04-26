// screen/AcceptOrderScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import AsyncStorage            from '@react-native-async-storage/async-storage';
import { useFocusEffect }      from '@react-navigation/native';

const AcceptOrderScreen = ({ route, navigation }) => {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};

  const [orders,   setOrders] = useState([]);
  const [sessionID,setSID]    = useState(null);

  const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  const BASE_URL = `http://${HOST}/WesDashAPI`;

  /* ───── 拉取订单列表 ───── */
  const fetchOrders = async (sid = sessionID) => {
    if (!sid) return;
    try {
      const r  = await fetch(`${BASE_URL}/accept_order.php`, {
        method:'GET',
        credentials:'include',
        headers:{ Cookie:`PHPSESSID=${sid}` },
      });
      const d = await r.json();
      d.success
        ? setOrders(d.orders)
        : Alert.alert('Error', d.message || 'Failed to fetch orders.');
    } catch {
      Alert.alert('Error','Network issue while fetching orders.');
    }
  };

  /* 首次进入 */
  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) { Alert.alert('Error','Session ID not found.'); return; }
      setSID(sid);
      fetchOrders(sid);
    })();
  }, []);

  /* 页面聚焦时刷新 */
  useFocusEffect(useCallback(() => {
    if (sessionID) fetchOrders(sessionID);
  }, [sessionID]));

  /* ───── 接单 ───── */
  const handleAcceptOrder = async (id) => {
    try {
      const r = await fetch(`${BASE_URL}/accept_order.php`, {
        method:'PUT',
        credentials:'include',
        headers:{
          'Content-Type':'application/json',
          Cookie:`PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!d.success) return Alert.alert('Error', d.message || 'Accept failed.');
      setOrders(prev => prev.map(o =>
        o.id===id ? { ...o, status:'accepted', room_id:d.room_id||o.room_id } : o
      ));
      d.room_id
        ? navigation.navigate('Chat',{ roomId:d.room_id, username })
        : Alert.alert('Success','Order accepted!');
    } catch { Alert.alert('Error','Network error while accepting.'); }
  };

  /* ───── DROP-OFF → 跳到输入页面 ───── */
  const handleDropOffOrder = (id) => {
    navigation.navigate('DropOffScreen', {
      requestId:     id,
      sessionID,          // 传给下一页做 multipart 请求
      BASE_URL,
      refreshOrders: () => fetchOrders(sessionID),
    });
  };

  /* 坐标合法性检查 */
  const hasCoords = (loc) => {
    if (!loc) return false;
    const p = `${loc}`.split(',').map(s=>parseFloat(s.trim()));
    return p.length===2 && p.every(Number.isFinite);
  };

  /* 单条卡片 */
  const OrderCard = ({ item }) => (
    <View style={styles.card}>
      {item.item && (
        <>
          <Text style={styles.label}>Item:</Text>
          <Text style={styles.text}>{item.item}</Text>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.text}>{item.quantity}</Text>
          <Text style={styles.label}>Drop-off:</Text>
          <Text style={styles.text}>{item.drop_off_location}</Text>
          <Text style={styles.label}>Speed:</Text>
          <Text style={styles.text}>{item.delivery_speed}</Text>
        </>
      )}

      <Text style={styles.label}>Status:</Text>
      <View style={[
        styles.statusBox,
        item.status==='pending'  ? styles.pending  :
        item.status==='accepted' ? styles.accepted : styles.completed,
      ]}>
        <Text style={styles.statusTxt}>{item.status.toUpperCase()}</Text>
      </View>

      {item.status==='pending' && (
        <Button title="ACCEPT" onPress={()=>handleAcceptOrder(item.id)}/>
      )}

      {item.status==='accepted' && (
        <>
          {hasCoords(item.drop_off_location)
            ? <Button title="NAVIGATE TO DROP-OFF"
                onPress={()=>navigation.navigate('NavigationToLocationScreen',{
                  dropOffLocation:item.drop_off_location,
                })}/>
            : <Button title="NO DROP-OFF MAP" color="#999"
                onPress={()=>Alert.alert('No coordinates')}/>}

          <Button title="DROP OFF" onPress={()=>handleDropOffOrder(item.id)}/>

          {item.room_id && (
            <Button title="CHAT"
              onPress={()=>navigation.navigate('Chat',{ roomId:item.room_id, username })}/>
          )}
        </>
      )}
    </View>
  );

  /* 渲染 */
  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTxt}>Logged in as: {username}</Text>
        <Text style={styles.infoTxt}>Role: {role==='dasher' ? 'Dasher' : 'User'}</Text>
      </View>

      <Text style={styles.heading}>Orders for Acceptance</Text>

      <FlatList
        data={orders}
        keyExtractor={o=>o.id.toString()}
        renderItem={({item})=> <OrderCard item={item}/> }
        ListEmptyComponent={<Text style={{textAlign:'center',marginTop:40}}>No orders.</Text>}
      />
    </View>
  );
};

/* 样式 */
const styles = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor:'#fff' },
  heading:{ fontSize:24, fontWeight:'bold', marginBottom:10, textAlign:'center' },
  infoBox:{ paddingVertical:8, borderBottomWidth:1, borderColor:'#eee', marginBottom:12 },
  infoTxt:{ fontSize:16, marginBottom:4, fontWeight:'500', color:'#333' },

  card:{ padding:12, borderWidth:1, borderColor:'#ccc', borderRadius:6, marginBottom:14 },
  label:{ fontSize:16, fontWeight:'700', marginTop:4 },
  text:{ fontSize:16, marginBottom:4 },

  statusBox:{ padding:6, borderRadius:4, alignItems:'center', marginBottom:8 },
  pending:{ backgroundColor:'#ffcc00' },
  accepted:{ backgroundColor:'#66cc66' },
  completed:{ backgroundColor:'#007bff' },
  statusTxt:{ color:'#fff', fontWeight:'bold' },
});

export default AcceptOrderScreen;
