// screen/CreateRequestScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

/* ─────────────────────────────────────────────────────── */
const CreateRequestScreen = ({ route, navigation }) => {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};

  /* -------------- state -------------- */
  const [items, setItems]           = useState([]);
  const [selectedItem, setSelected] = useState('');
  const [quantity, setQuantity]     = useState('1');
  const [dropOffLocation, setLoc]   = useState('');
  const [deliverySpeed, setSpeed]   = useState('common');
  const [sessionID, setSessionID]   = useState(null);

  /* map region & marker */
  const [region, setRegion] = useState({
    latitude:       41.5556,    // Wesleyan
    longitude:     -72.6558,
    latitudeDelta:  0.02,
    longitudeDelta: 0.02,
  });
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) { Alert.alert('Error', 'Session ID not found'); return; }
      setSessionID(sid);

      try {
        const resp = await fetch('http://10.0.2.2/WesDashAPI/get_wesshop_items.php', {
          credentials: 'include',
          headers: { Cookie: `PHPSESSID=${sid}` },
        });
        const data = await resp.json();
        if (!data.success) throw new Error('Failed to load items');

        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        if (list.length) setSelected(list[0].name);
      } catch (e) {
        Alert.alert('Error', 'Could not load shop items.');
      }
    })();
  }, []);

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarker(coord);
    setLoc(`${coord.latitude}, ${coord.longitude}`);
  };

  const handleSubmit = async () => {
    if (!selectedItem || !dropOffLocation) {
      Alert.alert('Error', 'Item and Drop-off Location cannot be empty!');
      return;
    }

    const row   = items.find((i) => i.name === selectedItem);
    const reqQ  = parseInt(quantity, 10) || 1;
    if (row && reqQ > row.number) {
      Alert.alert(
        'Alert',
        'Requested quantity exceeds stock. Proceed anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => createOrder(reqQ) },
        ]
      );
    } else {
      createOrder(reqQ);
    }
  };

  const createOrder = async (qty) => {
    try {
      const resp = await fetch('http://10.0.2.2/WesDashAPI/create_requests.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          item: selectedItem,
          quantity: qty,
          drop_off_location: dropOffLocation,
          delivery_speed: deliverySpeed,
        }),
      });

      const txt  = await resp.text();
      const data = JSON.parse(txt);

      if (resp.ok && data.success) {
        Alert.alert('Success', data.success, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        throw new Error(data.error || 'Failed to create request');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  /* -------------- UI -------------- */
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* 登录信息 */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTxt}>Logged in as: {username}</Text>
        <Text style={styles.infoTxt}>Role: {role === 'dasher' ? 'Dasher' : 'User'}</Text>
      </View>

      {/* 选择商品 */}
      <Text style={styles.label}>Item:</Text>
      <Picker selectedValue={selectedItem} onValueChange={setSelected}>
        {items.map((i) => (
          <Picker.Item
            key={i.id}
            label={`${i.name} (In stock: ${i.number})`}
            value={i.name}
          />
        ))}
      </Picker>

      {/* 数量 */}
      <Text style={styles.label}>Quantity:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />

      {/* 地点输入框 */}
      <Text style={styles.label}>Drop-off Location (lat, lng):</Text>
      <TextInput
        style={styles.input}
        value={dropOffLocation}
        onChangeText={setLoc}
        placeholder="Tap the map or type coordinates"
      />

      {/* 地图 */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}         // OSM provider
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {/* 速度 */}
      <Text style={styles.label}>Delivery Speed:</Text>
      <View style={styles.radioRow}>
        {['urgent', 'common'].map((spd) => (
          <Button
            key={spd}
            title={spd.charAt(0).toUpperCase() + spd.slice(1)}
            onPress={() => setSpeed(spd)}
            color={deliverySpeed === spd ? 'blue' : 'gray'}
          />
        ))}
      </View>

      {/* 提交按钮 */}
      <Button title="Create Request" onPress={handleSubmit} />

    </ScrollView>
  );
};

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },

  infoBox: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 },
  infoTxt: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 },

  label:   { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  input:   { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, marginTop: 4 },

  radioRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },

  map: { width: '100%', height: 220, marginTop: 10, borderRadius: 6 },
});

export default CreateRequestScreen;
