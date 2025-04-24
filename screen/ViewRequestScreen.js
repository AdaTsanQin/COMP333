// screen/ViewRequestsScreen.js
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewRequestsScreen = ({ route, navigation }) => {
  /* ───────── 基本状态 ───────── */
  const { username = 'Unknown', role = 'user' } = route.params ?? {};
  const [requests, setRequests] = useState([]);
  const [sessionID, setSessionID] = useState(null);

  /* ───────── 统一提示 ───────── */
  const showAlert = (title, msg, ok = false) =>
    Alert.alert(title, msg, [{ text: 'OK', onPress: () => ok && fetchRequests() }]);

  /* ───────── 拉取请求列表 ───────── */
  const fetchRequests = async () => {
    try {
      const r = await fetch('http://10.0.2.2/WesDashAPI/accept_requests.php', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
      });
      const d = await r.json();
      d.success
        ? setRequests(d.requests)
        : showAlert('Error', d.message || 'Failed to fetch requests');
    } catch {
      showAlert('Error', 'Network error while fetching requests');
    }
  };

  /* ───────── 组件加载 ───────── */
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('PHPSESSID');
      if (!id) return showAlert('Error', 'Session not found');
      setSessionID(id);
      fetchRequests();
    })();
  }, []);

  /* ───────── 删除请求 ───────── */
  const handleDelete = async (id) => {
    try {
      const r = await fetch('http://10.0.2.2/WesDashAPI/accept_requests.php', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify({ delete_id: id }),
      });
      const d = await r.json();
      showAlert(d.success ? 'Deleted' : 'Error', d.message, d.success);
    } catch {
      showAlert('Error', 'Delete failed – network error');
    }
  };

  /* ───────── 编辑请求 ───────── */
  const handleEdit = async (obj) => {
    try {
      const r = await fetch('http://10.0.2.2/WesDashAPI/edit.php', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify(obj),
      });
      const d = await r.json();
      showAlert(d.success ? 'Saved' : 'Error', d.message, d.success);
    } catch {
      showAlert('Error', 'Edit failed – network error');
    }
  };

  /* ───────── 确认完成 ───────── */
  const handleConfirm = async (id) => {
    try {
      const r = await fetch('http://10.0.2.2/WesDashAPI/accept_requests.php', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`,
        },
        body: JSON.stringify({ request_id: id }),
      });
      const d = await r.json();
      showAlert(
        d.success ? 'Confirmed' : 'Error',
        d.message || 'Confirm failed',
        d.success
      );
    } catch {
      showAlert('Error', 'Confirm failed – network error');
    }
  };

  /* ───────── 单条请求卡片 ───────── */
  const RequestItem = ({ item }) => {
    const [itemName, setItemName] = useState(item.item);
    const [loc, setLoc] = useState(item.drop_off_location);
    const [speed, setSpeed] = useState(item.delivery_speed);

    return (
      <View style={styles.card}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput style={styles.input} value={itemName} onChangeText={setItemName} />

        <Text style={styles.label}>Drop-off Location</Text>
        <TextInput style={styles.input} value={loc} onChangeText={setLoc} />

        <Text style={styles.label}>Delivery Speed</Text>
        <View style={styles.radioRow}>
          {['urgent', 'common'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.radioBtn,
                speed === s && styles.radioSelected,
              ]}
              onPress={() => setSpeed(s)}
            >
              <Text style={speed === s ? styles.radioTxtSel : styles.radioTxt}>
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Save"
            onPress={() =>
              handleEdit({
                id: item.id,
                item: itemName,
                drop_off_location: loc,
                delivery_speed: speed,
                status: item.status,
              })
            }
          />
          <Button title="Delete" color="#ff6666" onPress={() => handleDelete(item.id)} />
        </View>

        {item.status === 'completed' && (
          <Button title="Confirm Received" onPress={() => handleConfirm(item.id)} />
        )}

        {/* 有 room_id 才显示 Chat 按钮 */}
        {item.room_id && (
          <Button
            title="Chat"
            onPress={() =>
              navigation.navigate('Chat', { roomId: item.room_id, username })
            }
          />
        )}
      </View>
    );
  };

  /* ───────── 组件 UI ───────── */
  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTxt}>Logged in as: {username}</Text>
        <Text style={styles.infoTxt}>Role: {role === 'dasher' ? 'Dasher' : 'User'}</Text>
      </View>

      <Text style={styles.heading}>My Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RequestItem item={item} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40 }}>No requests yet</Text>
        }
      />
    </View>
  );
};

/* ────────── 样式 ────────── */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  infoBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  infoTxt: { fontSize: 16, marginBottom: 4, fontWeight: '500', color: '#333' },

  card: {
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
  },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 8,
  },
  radioBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 4,
  },
  radioSelected: { backgroundColor: '#007bff', borderColor: '#007bff' },
  radioTxt: { color: '#333' },
  radioTxtSel: { color: '#fff', fontWeight: 'bold' },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
});

export default ViewRequestsScreen;
