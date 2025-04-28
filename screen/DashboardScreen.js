// screen/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, Switch, TouchableOpacity,
  Image, Dimensions, TextInput, Platform     // ← 加 Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';          // ← 加

const RED       = '#C41E3A';
const RED_DARK  = '#991427';
const BLUE      = '#5978FF';
const GREEN     = '#2e8b57';      
const GREY_TXT  = '#666';
const BG_COLOR  = '#F3F4F8';
const CARD_BG   = '#ffffff';
const CARD_SHADOW = '#00000020';

const HOST     = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}/WesDashAPI`;

export default function DashboardScreen({ route, navigation }) {
  const { username = 'User', role: initRole = 'user' } = route.params || {};

  const [role, setRole]   = useState(initRole);
  const [balance, setBal] = useState(null);         // 美元字符串
  const [showDanger, setShowDanger] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [confirmPasswordToDelete, setConfirmPasswordToDelete] = useState('');

  /* ── 拉取余额 ── */
  const fetchBalance = async () => {
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) return;
      const r = await fetch(`${BASE_URL}/get_balance.php`, {
        credentials: 'include',
        headers: { Cookie: `PHPSESSID=${sid}` },
      });
      const d = await r.json();
      if (d.success) setBal((d.balance / 100).toFixed(2));
    } catch {/* ignore 网络错误 */ }
  };

  /* 首次进入 + 每次重新聚焦时刷新余额 */
  useFocusEffect(useCallback(() => { fetchBalance(); }, []));

  useEffect(() => {
    (async () => {
      // Only check for pending reviews if user role is 'user' (buyer)
      if (role !== 'user') return;
      
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) {
        Alert.alert('Error', 'Session ID not found. Please log in again.');
        return;
      }

      try {
        const response = await fetch('http://10.0.2.2/WesDashAPI/get_pending_review.php', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success && data.order) {
          Alert.alert(
            'Review Your Dasher',
            `Your order "${data.order.item}" has been delivered. Would you like to leave a review for ${data.order.accepted_by}?`,
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: async () => {
                  try {
                    await fetch('http://10.0.2.2/WesDashAPI/cancel_review_prompt.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ order_id: data.order.id }),
                      credentials: 'include',
                    });
                  } catch (error) {
                    console.error('Error cancelling review prompt:', error);
                  }
                },
              },
              {
                text: 'Leave Review',
                onPress: () => {
                  navigation.navigate('CreateReviewScreen', { 
                    taskId: data.order.id,
                    dashername: data.order.accepted_by,
                    item: data.order.item
                  });
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error fetching pending review:', error);
      }
    })();
  }, [role, navigation]);

  const handleLogout = () => navigation.navigate('Home');

  const handleDeleteAccount = async () => {
    if (passwordToDelete !== confirmPasswordToDelete) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      const resp = await fetch(`${BASE_URL}/delete_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordToDelete }),
        credentials: 'include',
      });
      const data = await resp.json();
      if (data.success) {
        Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  /** 统一的大按钮组件 */
  const BigButton = ({ title, onPress, color = RED }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.bigBtn, { backgroundColor: color }]}
    >
      <Text style={styles.bigBtnTxt}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Logo + Greeting */}
      <Image source={require('../assets/cardinal.png')} style={styles.logo} />
      <Text style={styles.hi}>
        Hi, {username} <Text style={{ fontSize: 28 }}>👋</Text>
      </Text>

      {/* Role Switch */}
      <View style={styles.roleRow}>
        <Text style={styles.roleTxt}>Role: {role}</Text>
        <Switch
          value={role === 'dasher'}
          onValueChange={(v) => setRole(v ? 'dasher' : 'user')}
          thumbColor={RED}
          trackColor={{ false: '#ddd', true: '#fbd4d9' }}
        />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTxt}>
            Balance{balance!==null && `  $${balance}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.topUpBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RechargeScreen', { username, role })}
        >
          <Text style={styles.topUpTxt}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Main Buttons */}
      {role === 'user' ? (
        <>
          <BigButton
            title="Create Request"
            onPress={() => navigation.navigate('SearchScreen', { username, role })}
          />
          <BigButton
            title="View Request"
            onPress={() => navigation.navigate('ViewRequestScreen', { username, role })}
          />
          <BigButton
            title="Manage Reviews"
            color="#28a745"
            onPress={() => navigation.navigate('ManageReviewsScreen', { username, role })}
          />
        </>
      ) : (
        <BigButton
          title="Accept Orders"
          onPress={() => navigation.navigate('AcceptOrderScreen', { username, role })}
        />
      )}

      <BigButton
        title="Chat Rooms"
        color={GREEN}
        onPress={() => navigation.navigate('Chats', { username, role })}
      />

      {/* Danger Zone */}
      <TouchableOpacity
        onPress={() => {
          setShowDanger(!showDanger);
          setPasswordToDelete('');
          setConfirmPasswordToDelete('');
        }}
        style={styles.dangerToggle}
      >
        <Text style={{ color: RED_DARK, fontSize: 15 }}>⚠️ Danger Zone</Text>
      </TouchableOpacity>

      {showDanger && (
        <View style={styles.deleteContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            secureTextEntry
            value={passwordToDelete}
            onChangeText={setPasswordToDelete}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPasswordToDelete}
            onChangeText={setConfirmPasswordToDelete}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDeleteAccount}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteTxt}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logout}>
        <Text style={{ fontSize: 16, color: GREY_TXT }}>↩ Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const { height } = Dimensions.get('window');
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    paddingTop: height * 0.08,
  },
  logo: { width: 90, height: 90, resizeMode: 'contain', marginBottom: 4 },
  hi: { fontSize: 34, fontWeight: '700', marginVertical: 10 },

  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  roleTxt: { fontSize: 17, color: GREY_TXT, marginRight: 8 },

  /* Balance */
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  balanceCard: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: CARD_SHADOW,
  },
  balanceTxt: { fontSize: 18, fontWeight: '700', color: GREY_TXT },
  topUpBtn: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  topUpTxt: { fontSize: 26, color: '#fff', marginTop: -2 },

  /* Big buttons */
  bigBtn: {
    width: '78%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  bigBtnTxt: { fontSize: 20, color: '#fff', fontWeight: '600' },

  /* Danger zone */
  dangerToggle: { marginTop: 20 },
  deleteContainer: {
    width: '80%',
    marginTop: 12,
    alignItems: 'center',
    paddingBottom: 180,
  },
  input: {
    width: '100%',
    height: 42,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  deleteBtn: {
    width: '40%',
    backgroundColor: '#444',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteTxt: { fontSize: 16, color: '#fff', fontWeight: '600' },

  logout: { position: 'absolute', bottom: 20 },
});
