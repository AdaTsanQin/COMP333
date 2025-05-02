import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

const ChatScreen = ({ route }) => {
  const { roomId, username: paramUser } = route.params;
  const [username, setUsername] = useState(paramUser);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]);
  const lastTimeRef = useRef('1970-01-01 00:00:00');
  const listRef = useRef(null);
  const [sessionID, setSessionID] = useState(null);
  const intervalRef = useRef(null);

  // Poll for new messages every 2.5s
  const poll = async () => {
    if (!sessionID) return;
    try {
      const url = `${BASE_URL}/chat.php` +
        `?room_id=${roomId}` +
        `&after=${encodeURIComponent(lastTimeRef.current)}` +
        `&PHPSESSID=${sessionID}`;
      const resp = await fetch(url, {
        credentials: 'include',
        headers: {
          Cookie: `PHPSESSID=${sessionID}`
        }
      });
      const data = await resp.json();
      if (data.success && data.msgs.length) {
        lastTimeRef.current = data.msgs.at(-1).sent_at;
        setMsgs(prev => [...prev, ...data.msgs]);
        listRef.current?.scrollToEnd({ animated: true });
      }
    } catch (e) {
      console.error('[Poll Error]', e.message);
    }
  };

  // Send message
  const send = async () => {
    const msg = input.trim();
    if (!msg || !sessionID) return;
    setInput('');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setMsgs(prev => [...prev, { sender: username, message: msg, sent_at: now }]);
    lastTimeRef.current = now;
    listRef.current?.scrollToEnd({ animated: true });

    try {
      const url = `${BASE_URL}/chat.php?PHPSESSID=${sessionID}`;
      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionID}`
        },
        body: JSON.stringify({ room_id: roomId, sender: username, message: msg })
      });
      const raw = await resp.text();
      console.log('CHAT POST raw:', raw);
    } catch (e) {
      console.error('[Send Error]', e.message);
    }
  };

  // Load session ID and username on mount
  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      const storedUser = await AsyncStorage.getItem('username');
      if (sid) setSessionID(sid);
      if (!username && storedUser) setUsername(storedUser);
    })();
  }, []);

  // Start polling after SID is available
  useEffect(() => {
    if (!sessionID) return;
    poll();
    intervalRef.current = setInterval(poll, 2500);
    return () => clearInterval(intervalRef.current);
  }, [sessionID]);

  const renderItem = ({ item }) => (
    <Text style={item.sender === username ? styles.me : styles.other}>
      {item.sender}: {item.message}
    </Text>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={msgs}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type message…"
        />
        <Button title="SEND" onPress={send} />
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 4, padding: 8, marginRight: 8 },
  me: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6', padding: 6, borderRadius: 4, marginVertical: 2 },
  other: { alignSelf: 'flex-start', backgroundColor: '#eee', padding: 6, borderRadius: 4, marginVertical: 2 },
});
