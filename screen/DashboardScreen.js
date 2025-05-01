// screen/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from './config';

const RED        = '#C41E3A';
const RED_DARK   = '#991427';
const BLUE       = '#5978FF';
const GREEN      = '#2e8b57';
const GREY_TXT   = '#666';
const BG_COLOR   = '#F3F4F8';
const CARD_BG    = '#ffffff';
const CARD_SHADOW= '#00000020';

export default function DashboardScreen({ route, navigation }) {
  const { username = 'User', role: initRole = 'user' } = route.params || {};

  const [role, setRole]                         = useState(initRole);
  const [balance, setBalance]                   = useState(null);
  const [showDanger, setShowDanger]             = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [confirmPasswordToDelete, setConfirmPasswordToDelete] = useState('');

  /** Fetch current balance from server */
  const fetchBalance = async () => {
    try {
      const sid = await AsyncStorage.getItem('PHPSESSID');
      if (!sid) {
        console.warn('[Dashboard] No session ID found.');
        return;
      }

      const res = await fetch(
        `${BASE_URL}/get_balance.php?PHPSESSID=${sid}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `PHPSESSID=${sid}`,
          },
        }
      );

      const text = await res.text();
      console.log('[Dashboard] balance raw:', text);
      const data = JSON.parse(text);

      if (data.success && typeof data.balance === 'number') {
        setBalance((data.balance / 100).toFixed(2));
      } else {
        console.warn('[Dashboard] Balance fetch failed:', data.message || data.error);
      }
    } catch (err) {
      console.error('[Dashboard] fetchBalance error:', err);
    }
  };

  /** Run on mount + every time this screen regains focus */
  useFocusEffect(useCallback(() => {
    fetchBalance();
  }, []));

  /** Check for a delivered order that needs a review */
  useEffect(() => {
    if (role !== 'user') return;

    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/get_pending_review.php`,
          { method: 'GET', credentials: 'include' }
        );
        const data = await res.json();

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
                    await fetch(
                      `${BASE_URL}/cancel_review_prompt.php`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ order_id: data.order.id }),
                      }
                    );
                  } catch (err) {
                    console.error('[Dashboard] cancel review error:', err);
                  }
                },
              },
              {
                text: 'Leave Review',
                onPress: () => {
                  navigation.navigate('CreateReviewScreen', {
                    taskId: data.order.id,
                    dashername: data.order.accepted_by,
                    item: data.order.item,
                  });
                },
              },
            ]
          );
        }
      } catch (err) {
        console.error('[Dashboard] pending review error:', err);
      }
    })();
  }, [role, navigation]);

  /** Logout handler */
  const handleLogout = () => navigation.navigate('Home');

  /** Delete account handler */
  const handleDeleteAccount = async () => {
    if (passwordToDelete !== confirmPasswordToDelete) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/delete_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: passwordToDelete }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Account Deleted', 'Your account has been deleted.');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  /** Reusable big button */
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
      {/* Logo & greeting */}
      <Image
        source={require('../assets/cardinal.png')}
        style={styles.logo}
      />
      <Text style={styles.hi}>
        Hi, {username} <Text style={{ fontSize: 28 }}>👋</Text>
      </Text>

      {/* Role toggle */}
      <View style={styles.roleRow}>
        <Text style={styles.roleTxt}>Role: {role}</Text>
        <Switch
          value={role === 'dasher'}
          onValueChange={v => setRole(v ? 'dasher' : 'user')}
          thumbColor={RED}
          trackColor={{ false: '#ddd', true: '#fbd4d9' }}
        />
      </View>

      {/* Balance card */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTxt}>
            Balance {balance !== null ? `$${balance}` : '...'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.topUpBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('RechargeScreen', { username, role })
          }
        >
          <Text style={styles.topUpTxt}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Main actions */}
      {role === 'user' ? (
        <>
          <BigButton
            title="Create Request"
            onPress={() =>
              navigation.navigate('SearchScreen', { username, role })
            }
          />
          <BigButton
            title="View Request"
            onPress={() =>
              navigation.navigate('ViewRequestScreen', { username, role })
            }
          />
          <BigButton
            title="Manage Reviews"
            color={GREEN}
            onPress={() =>
              navigation.navigate('ManageReviewsScreen', { username, role })
            }
          />
        </>
      ) : (
        <BigButton
          title="Accept Orders"
          onPress={() =>
            navigation.navigate('AcceptOrderScreen', { username, role })
          }
        />
      )}
      <BigButton
        title="Chat Rooms"
        color={GREEN}
        onPress={() =>
          navigation.navigate('Chats', { username, role })
        }
      />

      {/* Danger Zone */}
      <TouchableOpacity
        style={styles.dangerToggle}
        onPress={() => {
          setShowDanger(!showDanger);
          setPasswordToDelete('');
          setConfirmPasswordToDelete('');
        }}
      >
        <Text style={{ color: RED_DARK, fontSize: 15 }}>
          ⚠️ Danger Zone
        </Text>
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
            style={styles.deleteBtn}
            activeOpacity={0.85}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteTxt}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={styles.logout}
        onPress={handleLogout}
      >
        <Text style={{ fontSize: 16, color: GREY_TXT }}>
          ↩ Logout
        </Text>
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
    paddingTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  hi: {
    fontSize: 34,
    fontWeight: '700',
    marginVertical: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  roleTxt: {
    fontSize: 17,
    color: GREY_TXT,
    marginRight: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  balanceCard: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: CARD_SHADOW,
  },
  balanceTxt: {
    fontSize: 18,
    fontWeight: '700',
    color: GREY_TXT,
  },
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
  topUpTxt: {
    fontSize: 26,
    color: '#fff',
    marginTop: -2,
  },
  bigBtn: {
    width: '78%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 6,
  },
  bigBtnTxt: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  dangerToggle: {
    marginTop: 20,
  },
  deleteContainer: {
    width: '80%',
    marginTop: 12,
    alignItems: 'center',
    paddingBottom: 120,
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
  deleteTxt: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  logout: {
    position: 'absolute',
    bottom: 20,
  },
});

