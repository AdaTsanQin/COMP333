import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Button, StyleSheet, Alert, FlatList, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function AcceptOrderScreen({ route, navigation }) {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};
  const [orders,   setOrders] = useState([]);
  const [sessionID,setSID]    = useState(null);

  /* ───────── fetch list ───────── */
  const fetchOrders = async (sid=sessionID) => {
    if (!sid) return;
    try {
      const r = await fetch(`${BASE_URL}/accept_order.php`, {
        credentials:'include',
        headers:{ Cookie:`PHPSESSID=${sid}` },
      });
      const d = await r.json();
      d.success ? setOrders(d.orders)
                : Alert.alert('Error',d.message||'Load failed');
    } catch { Alert.alert('Error','Network'); }
  };

  /* first load */
  useEffect(()=>{ (async()=>{
    const id = await AsyncStorage.getItem('PHPSESSID');
    if (!id){Alert.alert('Error','No session');return;}
    setSID(id); fetchOrders(id);
  })(); },[]);

  useFocusEffect(useCallback(()=>{ if(sessionID) fetchOrders(); },[sessionID]));

  /* ───────── accept ───────── */
  const accept = async (id) => {
    try{
      const r = await fetch(`${BASE_URL}/accept_order.php`,{
        method:'PUT', credentials:'include',
        headers:{'Content-Type':'application/json',Cookie:`PHPSESSID=${sessionID}`},
        body:JSON.stringify({id})
      });
      const d = await r.json();
      if(!d.success) return Alert.alert('Error',d.message||'Failed');
      setOrders(p=>p.map(o=>o.id===id?{...o,status:'accepted',room_id:d.room_id||o.room_id}:o));
      if(d.room_id) navigation.navigate('Chat',{roomId:d.room_id,username});
    }catch{Alert.alert('Error','Accept net err');}
  };

  /* ───────── drop-off helper ───────── */
  const backendDrop = async (id) => {
    try{
      const r = await fetch(`${BASE_URL}/accept_order.php`,{
        method:'PUT', credentials:'include',
        headers:{'Content-Type':'application/json',Cookie:`PHPSESSID=${sessionID}`},
        body:JSON.stringify({id,action:'drop_off'})
      });
      const d = await r.json();
      d.success ? (Alert.alert('Success','Dropped off'), fetchOrders())
                : Alert.alert('Error',d.message||'Drop failed');
    }catch{Alert.alert('Error','Drop net err');}
  };

  /* ───────── triggered from button ───────── */
  const handleDropOff = (o) => {
    // 若为自定义 & 尚无价格，需要输入
    if (o.is_custom == 1 || !o.est_price || Number(o.est_price) === 0) {
      navigation.navigate('DropOffScreen',{
        requestId : o.id,
        sessionID,
        BASE_URL,
        refresh: () => fetchOrders(),   // 回调刷新
      });
    } else {
      backendDrop(o.id);
    }
  };

  const hasCoords = loc=>{
    if(!loc) return false;
    const p=`${loc}`.split(',').map(s=>parseFloat(s.trim()));
    return p.length===2 && p.every(Number.isFinite);
  };

  /* card */
  const Card = ({item:o})=>(
    <View style={styles.card}>
      <Text style={styles.label}>Item:</Text><Text>{o.item}</Text>
      {o.quantity && <><Text style={styles.label}>Qty:</Text><Text>{o.quantity}</Text></>}
      <Text style={styles.label}>Status:</Text>
      <View style={[
        styles.stBox,
        o.status==='pending'?styles.pending :
        o.status==='accepted'?styles.accepted : styles.completed]}>
        <Text style={styles.stTxt}>{o.status.toUpperCase()}</Text>
      </View>

      {o.status==='pending' && <Button title="ACCEPT" onPress={()=>accept(o.id)}/>}

      {o.status==='accepted' && (
        <>
          {/* ── 新增：若订单指定了商店坐标，显示跳店按钮 ── */}
          {hasCoords(o.purchase_mode) && o.purchase_mode!=='DASHER_CHOOSING' &&
            <Button title="NAVIGATE TO STORE"
              onPress={()=>navigation.navigate(
                'NavigationToLocationScreen',
                { dropOffLocation: o.purchase_mode }   // 复用同一个地图页面
              )}
            />}

          {hasCoords(o.drop_off_location)
            ? <Button title="NAVIGATE TO DROP-OFF"
                onPress={()=>navigation.navigate('NavigationToLocationScreen',
                  {dropOffLocation:o.drop_off_location})}/>
            : <Button title="NO DROP-OFF MAP" color="#999"/>}

          <Button title="DROP OFF" onPress={()=>handleDropOff(o)}/>

          {o.room_id && <Button title="CHAT"
              onPress={()=>navigation.navigate('Chat',{roomId:o.room_id,username})}/>}
        </>
      )}
    </View>
  );

  return(
    <View style={styles.container}>
      <Text style={styles.h}>Orders for Acceptance</Text>
      <FlatList data={orders} keyExtractor={i=>i.id.toString()}
        renderItem={({item})=> <Card item={item}/> }
        ListEmptyComponent={<Text style={{textAlign:'center',marginTop:40}}>No orders.</Text>}/>
    </View>
  );
}

/* styles */
const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#fff'},
  h:{fontSize:24,fontWeight:'700',textAlign:'center',marginBottom:10},
  card:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:12,marginBottom:14},
  label:{fontWeight:'700',marginTop:4},
  stBox:{padding:6,borderRadius:4,alignItems:'center',marginVertical:6},
  pending:{backgroundColor:'#ffcc00'},accepted:{backgroundColor:'#66cc66'},
  completed:{backgroundColor:'#007bff'},stTxt:{color:'#fff',fontWeight:'700'},
});
