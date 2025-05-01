// screen/CustomOrderScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { BASE_URL } from './config';

export default function CustomOrderScreen({ navigation, route }) {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};

  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [speed, setSpeed] = useState('common');
  const [where, setWhere] = useState('dasher');
  const [storeCoord, setStoreCoord] = useState(null);
  const [storeTxt, setStoreTxt] = useState('');
  const [dropCoord, setDropCoord] = useState(null);
  const [dropTxt, setDropTxt] = useState('');

  const defaultRegion = {
    latitude: 41.5556,
    longitude: -72.6558,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const pickStore = (e) => {
    const c = e.nativeEvent.coordinate;
    setStoreCoord(c);
    setStoreTxt(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`);
  };

  const pickDrop = (e) => {
    const c = e.nativeEvent.coordinate;
    setDropCoord(c);
    setDropTxt(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`);
  };

  const handleSubmit = async () => {
    if (!desc.trim()) return Alert.alert('Error', 'Please describe the item(s).');
    if (where === 'specify' && !storeTxt.trim()) return Alert.alert('Error', 'Please choose / enter store coordinates.');
    if (!dropTxt.trim()) return Alert.alert('Error', 'Please choose / enter drop-off coordinates.');

    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');

      const res = await fetch(`${BASE_URL}/create_requests.php?PHPSESSID=${sid}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sid}`,
        },
        body: JSON.stringify({
          item: desc,
          quantity: 1,
          drop_off_location: dropTxt.trim(),
          delivery_speed: speed,
          est_price: price || null,
          total_price: price ? parseFloat(price) : 0,
          is_custom: 1,
          purchase_mode: where === 'specify' ? storeTxt.trim() : 'DASHER_CHOOSING',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');

      Alert.alert('Success', 'Order created!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ViewRequestScreen', { username, role }),
        },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Network error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Create Custom Order</Text>

        <Text style={styles.label}>Describe item(s)</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          multiline
          placeholder="e.g. 2 × AA batteries, 1 × scissors …"
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={styles.label}>Estimated total price (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 15.99"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>Delivery speed</Text>
        <View style={styles.row}>
          {['urgent', 'common'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.radioBtn, speed === s && styles.selected]}
              onPress={() => setSpeed(s)}
            >
              <Text style={speed === s ? styles.selTxt : styles.txt}>{s.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Where to purchase</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.radioBtn, where === 'dasher' && styles.selected]}
            onPress={() => setWhere('dasher')}
          >
            <Text style={where === 'dasher' ? styles.selTxt : styles.txt}>DASHER CHOOSES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioBtn, where === 'specify' && styles.selected]}
            onPress={() => setWhere('specify')}
          >
            <Text style={where === 'specify' ? styles.selTxt : styles.txt}>SPECIFY STORE</Text>
          </TouchableOpacity>
        </View>

        {where === 'specify' && (
          <>
            <Text style={styles.label}>Store location</Text>
            <TextInput
              style={styles.input}
              placeholder="lat, lng — tap map or type"
              value={storeTxt}
              onChangeText={setStoreTxt}
            />
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={defaultRegion}
              onPress={pickStore}
            >
              {storeCoord && <Marker coordinate={storeCoord} />}
            </MapView>
          </>
        )}

        <Text style={styles.label}>Drop-off location</Text>
        <TextInput
          style={styles.input}
          placeholder="lat, lng — tap map or type"
          value={dropTxt}
          onChangeText={setDropTxt}
        />
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={defaultRegion}
          onPress={pickDrop}
        >
          {dropCoord && <Marker coordinate={dropCoord} />}
        </MapView>

        <View style={{ height: 18 }} />
        <Button title="Submit Order" onPress={handleSubmit} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  radioBtn: {
    flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#007bff',
    borderRadius: 4, marginHorizontal: 4, alignItems: 'center',
  },
  selected: { backgroundColor: '#007bff' },
  txt: { color: '#007bff', fontWeight: '500' },
  selTxt: { color: '#fff', fontWeight: '700' },
  map: { width: '100%', height: 220, marginTop: 10, borderRadius: 6 },
});
