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

const CreateRequestScreen = ({ route, navigation }) => {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dropOff, setDropOff] = useState('');
  const [speed, setSpeed] = useState('common');
  const [sessionID, setSessionID] = useState(null);

  const [region, setRegion] = useState({
    latitude: 41.5556,
    longitude: -72.6558,
    latitudeDelta: 0.02,
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
        if (!data.success) throw new Error();

        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        if (list.length) setSelectedItem(list[0].name);
      } catch {
        Alert.alert('Error', 'Could not load shop items.');
      }
    })();
  }, []);

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarker(coord);
    setDropOff(`${coord.latitude}, ${coord.longitude}`);
  };

  const handleSubmit = () => {
    if (!selectedItem || !dropOff) {
      Alert.alert('Error', 'Item and drop-off location are required.');
      return;
    }

    const feeRate = speed === 'common' ? 0.05 : 0.20;
    Alert.alert(
      'Delivery Fee',
      `You selected ${speed} delivery. A ${feeRate * 100}% fee will be applied.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => submitOrder() },
      ]
    );
  };

  async function submitOrder() {
    // find the item row (so we can get its per‐unit price)
    const row = items.find((i) => i.name === selectedItem);
    const qty = parseInt(quantity, 10) || 1;

    // per‐unit price; adjust field name if yours differs
    const estPrice = row?.price ?? 0;

    // total price = unit price × quantity
    const totalPrice = parseFloat((estPrice * qty).toFixed(2));

    const proceed = async () => {
      try {
        const resp = await fetch('http://10.0.2.2/WesDashAPI/create_requests.php', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `PHPSESSID=${sessionID}`,
          },
          body: JSON.stringify({
            item: selectedItem,
            quantity: qty,
            drop_off_location: dropOff,
            delivery_speed: speed,
            est_price: estPrice,
            total_price: totalPrice,
          }),
        });
        const data = await resp.json();

        if (resp.ok && data.success) {
          Alert.alert('Success', `Request created (total: $${data.total_price})`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          throw new Error(data.error || 'Failed to create request.');
        }
      } catch (e) {
        Alert.alert('Error', e.message || 'Network error.');
      }
    };

    // if you still want the “quantity exceeds stock” warning:
    if (row && qty > row.number) {
      Alert.alert(
        'Warning',
        'Quantity exceeds current stock. Submit anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: proceed },
        ],
      );
    } else {
      proceed();
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTxt}>Logged in as: {username}</Text>
        <Text style={styles.infoTxt}>
          Role: {role === 'dasher' ? 'Dasher' : 'User'}
        </Text>
      </View>

      <Text style={styles.label}>Item:</Text>
      <Picker selectedValue={selectedItem} onValueChange={setSelectedItem}>
        {items.map((i) => (
          <Picker.Item
            key={i.id}
            label={`${i.name} (stock: ${i.number})`}
            value={i.name}
          />
        ))}
      </Picker>

      <Text style={styles.label}>Quantity:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />

      <Text style={styles.label}>Drop-off (lat, lng):</Text>
      <TextInput
        style={styles.input}
        value={dropOff}
        onChangeText={setDropOff}
        placeholder="Tap the map or type coordinates"
      />

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      <Text style={styles.label}>Delivery Speed:</Text>
      <View style={styles.radioRow}>
        {['urgent', 'common'].map((s) => (
          <Button
            key={s}
            title={s.charAt(0).toUpperCase() + s.slice(1)}
            onPress={() => setSpeed(s)}
            color={speed === s ? 'blue' : 'gray'}
          />
        ))}
      </View>

      <Button title="Create Request" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },

  infoBox: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 },
  infoTxt: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 },

  label: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, marginTop: 4 },

  radioRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },

  map: { width: '100%', height: 220, marginTop: 10, borderRadius: 6 },
});

export default CreateRequestScreen;

