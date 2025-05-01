import React, { useState } from 'react';
import {
  View, Text, FlatList, Image,
  TouchableOpacity, StyleSheet, Alert, Button,
} from 'react-native';
import { BASE_URL } from './config';

export default function CheckoutScreen({ navigation, route }) {
  const [cart, setCart]       = useState(route.params?.cart || []);
  const { username, role }    = route.params || {};
  
  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => {
    const itemPrice = item.items?.[0]?.price?.regular ? parseFloat(item.items[0].price.regular) : 0;
    return sum + itemPrice;
  }, 0).toFixed(2);

  /* 删除一条 */
  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  /* place → 跳到 OrderDetailsScreen */
  const placeOrder = () => {
    if (!cart.length) { Alert.alert('Cart empty'); return; }
    navigation.navigate('OrderDetails', { cart, username, role });
  };

  /* 图片处理 */
  const imgUrl = (itm) => {
    if (!itm.images?.length) return null;
    const img = itm.images.find(i => i.featured || i.perspective === 'front') || itm.images[0];
    return img.sizes?.[0]?.url ?? null;
  };

  /* 渲染购物车条目 */
  const renderItem = ({ item, index }) => (
    
    <View style={styles.card}>
      {imgUrl(item)
        ? <Image source={{ uri: imgUrl(item) }} style={styles.thumb}/>
        : <View style={[styles.thumb, { backgroundColor: '#ddd' }]}/>}
      <View style={styles.info}>
        <Text style={styles.title}>{item.description}</Text>
        <Text style={styles.brand}>{item.brand}</Text>
        {/* Display the price */}
        <Text style={styles.price}>
  {item.items?.[0]?.price?.regular ? `$${item.items[0].price.regular}` : 'Price not available'}
</Text>
      </View>
      <TouchableOpacity style={styles.del} onPress={() => removeItem(index)}>
        <Text style={{ color: '#fff' }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign:'center', marginTop:40 }}>Your cart is empty.</Text>}
      />

      <View style={styles.bar}>
        <View>
          <Text style={styles.totalTxt}>Items: {cart.length}</Text>
          <Text style={styles.totalPrice}>Total: ${totalPrice}</Text>
        </View>
        <Button title="Place Order" onPress={placeOrder}/>
      </View>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  card:{ flexDirection:'row', margin:10, backgroundColor:'#f9f9f9',
         borderRadius:8, elevation:2, overflow:'hidden' },
  thumb:{ width:80, height:80 },
  info:{ flex:1, padding:10 },
  title:{ fontSize:15, fontWeight:'600' },
  brand:{ fontSize:13, color:'#555', marginVertical:2 },
  del:{ justifyContent:'center', alignItems:'center', width:40, backgroundColor:'#e74c3c' },
  bar:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
        padding:16, borderTopWidth:1, borderColor:'#eee' },
  totalTxt:{ fontSize:18, fontWeight:'700' },
  totalPrice:{ fontSize:16, fontWeight:'700', color:'#2e8b57', marginTop:4 },
  price: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
});
