import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from './config';

const PRIMARY_COLOR = '#007bff';
const STATUS_COLOR  = '#66cc66';
const PENDING_COLOR = '#ffcc00';

export default function ViewRequestsScreen({ route, navigation }) {
  const { username = 'Unknown', role = 'user' } = route.params ?? {};
  const [requests, setRequests]   = useState([]);
  const [sessionID, setSessionID] = useState(null);

  const toast = (msg, ok = false) =>
    Alert.alert(ok ? 'Success' : 'Error', msg, [
      { text: 'OK', onPress: ok ? fetchRequests : undefined },
    ]);

  const fetchRequests = async () => {
    try {
      const r = await fetch(`${BASE_URL}/accept_requests.php?PHPSESSID=${sessionID}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
      });
      const d = await r.json();
      d.success ? setRequests(d.requests) : toast(d.message || 'Failed to load');
    } catch {
      toast('Network error');
    }
  };

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) return toast('Session not found');
      setSessionID(sid);
      fetchRequests();
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (sessionID && route.params?.refreshOnFocus) {
        fetchRequests();
        navigation.setParams({ refreshOnFocus: false });
      }
    }, [sessionID, route.params?.refreshOnFocus])
  );

  const doDelete = async (id) => {
    try {
      const r = await fetch(`${BASE_URL}/accept_requests.php?PHPSESSID=${sessionID}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify({ delete_id: id }),
      });
      const d = await r.json();
      toast(d.message, d.success);
    } catch {
      toast('Delete failed');
    }
  };

  const doEdit = async (payload) => {
    try {
      const r = await fetch(`${BASE_URL}/accept_requests.php?PHPSESSID=${sessionID}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      toast(d.message, d.success);
    } catch {
      toast('Update failed');
    }
  };

  const doConfirm = async (id) => {
    try {
      const r = await fetch(`${BASE_URL}/accept_requests.php?PHPSESSID=${sessionID}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify({ request_id: id }),
      });
      const d = await r.json();
      toast(d.message, d.success);
    } catch {
      toast('Confirm failed');
    }
  };

  const RequestItem = ({ item }) => {
    const [name,  setName]  = useState(item.item);
    const [loc ,  setLoc ]  = useState(item.drop_off_location);
    const [speed, setSpeed] = useState(item.delivery_speed);

    return (
      <View style={styles.card}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          multiline
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Drop-off Location</Text>
        <TextInput style={styles.input} value={loc} onChangeText={setLoc} />

        <Text style={styles.label}>Delivery Speed</Text>
        <View style={styles.radioRow}>
          {['urgent', 'common'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.radioBtn,
                speed === s && styles.radioSel,
              ]}
              onPress={() => setSpeed(s)}
            >
              <Text style={speed === s ? styles.radioTxtSel : styles.radioTxt}>
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.btnRow}>
          <Button
            title="SAVE"
            onPress={() =>
              doEdit({
                id: item.id,
                item: name,
                drop_off_location: loc,
                delivery_speed: speed,
                status: item.status,
              })
            }
          />
          <Button
            title="DELETE"
            color="#ff6666"
            onPress={() => doDelete(item.id)}
          />
        </View>

        <View style={[
          styles.statusBox,
          item.status === 'pending' && styles.pending
        ]}>
          <Text style={styles.statusTxt}>{item.status.toUpperCase()}</Text>
        </View>

        {item.status === 'completed' && (
          <Button
            title="VIEW BILL"
            color={PRIMARY_COLOR}
            onPress={() =>
              navigation.navigate('BillScreen', {
                request: item,
                onDone : fetchRequests,
              })
            }
          />
        )}

        {item.room_id && (
          <Button
            title="CHAT"
            color={PRIMARY_COLOR}
            onPress={() =>
              navigation.navigate('Chat', { roomId: item.room_id, username })
            }
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTxt}>Logged in as: {username}</Text>
        <Text style={styles.infoTxt}>
          Role: {role === 'dasher' ? 'Dasher' : 'User'}
        </Text>
      </View>

      <Text style={styles.heading}>My Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RequestItem item={item} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40 }}>
            No requests yet
          </Text>
        }
      />

      <Button
        title="BACK TO DASHBOARD"
        color={PRIMARY_COLOR}
        onPress={() => navigation.navigate('Dashboard', { username, role })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading:   { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  infoBox:   { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 12 },
  infoTxt:   { fontSize: 16, marginBottom: 4, fontWeight: '500', color: '#333' },

  card:      { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 14, backgroundColor: '#f8f8f8' },
  label:     { fontSize: 14, fontWeight: 'bold', marginTop: 6 },
  input:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 6, marginTop: 4, backgroundColor: '#fff' },

  radioRow:  { flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 8 },
  radioBtn:  { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: PRIMARY_COLOR, borderRadius: 4, marginHorizontal: 4, alignItems: 'center' },
  radioSel:  { backgroundColor: PRIMARY_COLOR },
  radioTxt:  { color: PRIMARY_COLOR, fontWeight: '500' },
  radioTxtSel:{ color: '#fff', fontWeight: '700' },

  btnRow:    { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginVertical: 6 },

  statusBox: { padding: 6, borderRadius: 4, alignItems: 'center', marginBottom: 8, backgroundColor: STATUS_COLOR },
  pending:   { backgroundColor: PENDING_COLOR },
  statusTxt: { color: '#fff', fontWeight: 'bold' },
});

