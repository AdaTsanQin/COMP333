import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { BASE_URL } from './config';

const ManageReviewsScreen = () => {
  const route = useRoute();
  const [username, setUsername] = useState(route.params?.username ?? null);
  const [role, setRole] = useState(route.params?.role ?? null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      if (!username) setUsername(await AsyncStorage.getItem('username'));
      if (!role) setRole(await AsyncStorage.getItem('role'));
    })();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      if (!sessionId) {
        Alert.alert('Session Missing', 'Please log in again.');
        return;
      }

      const response = await fetch(`${BASE_URL}/get_user_reviews.php?PHPSESSID=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${sessionId}`,
        },
        credentials: 'include',
      });

      const text = await response.text();
      console.log('Raw response:', text);

      const data = JSON.parse(text);
      if (data.success) {
        setTasks(data.tasks || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load completed tasks');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCompletedTasks();
    }, [])
  );

  const handleCreateReview = (taskId) => {
    navigation.navigate('CreateReviewScreen', { taskId, username, role });
  };

  const handleUpdateReview = (taskId) => {
    navigation.navigate('UpdateReview', { taskId, username, role });
  };

  const handleDeleteReview = (taskId) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const sessionId = await AsyncStorage.getItem('PHPSESSID');
            const task = tasks.find(t => t.task_id === taskId);
            if (!task) return Alert.alert('Error', 'Task not found');

            const response = await fetch(`${BASE_URL}/delete_review.php?PHPSESSID=${sessionId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Cookie: `PHPSESSID=${sessionId}`,
              },
              credentials: 'include',
              body: JSON.stringify({ review_id: task.review_id }),
            });

            const text = await response.text();
            console.log('Raw delete response:', text);

            const data = JSON.parse(text);
            if (data.success) {
              Alert.alert('Success', 'Review deleted successfully');
              fetchCompletedTasks();
            } else {
              Alert.alert('Error', data.message || 'Failed to delete review');
            }
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const renderTaskItem = ({ item }) => {
    const hasReview = item.comment && item.comment.trim() !== '';
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskId}>Task ID: {item.task_id}</Text>
          <Text style={styles.taskStatus}>{item.status}</Text>
        </View>

        <View style={styles.taskInfo}>
          <Text>Request ID: {item.request_id}</Text>
          <Text>Buyer: {item.username}</Text>
          <Text>Dasher: {item.dashername}</Text>
          <Text>Item: {item.item}</Text>
        </View>

        {hasReview ? (
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewTitle}>Review:</Text>
            <Text>Rating: {item.rating}/5</Text>
            <Text>Comment: {item.comment}</Text>
          </View>
        ) : (
          <Text style={styles.noReview}>No review yet</Text>
        )}

        <View style={styles.actionButtons}>
          {!hasReview ? (
            <TouchableOpacity style={styles.createButton} onPress={() => handleCreateReview(item.task_id)}>
              <Text style={styles.buttonText}>Create Review</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.updateButton} onPress={() => handleUpdateReview(item.task_id)}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteReview(item.task_id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Reviews</Text>
      <Text style={styles.subtitle}>Only completed orders can be reviewed</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : tasks.length === 0 ? (
        <Text style={styles.emptyText}>No completed tasks found</Text>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.task_id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Dashboard', { username, role })}
      >
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6c757d', marginBottom: 16, fontStyle: 'italic' },
  loader: { marginTop: 50 },
  emptyText: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginTop: 50 },
  listContainer: { paddingBottom: 16 },
  taskCard: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  taskId: { fontWeight: 'bold', fontSize: 16 },
  taskStatus: {
    backgroundColor: '#28a745', color: '#fff', fontSize: 12,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
  },
  taskInfo: { marginBottom: 12 },
  reviewInfo: {
    marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee'
  },
  reviewTitle: { fontWeight: 'bold', marginBottom: 4 },
  noReview: { fontStyle: 'italic', color: '#6c757d', marginBottom: 12 },
  actionButtons: { marginTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  createButton: {
    backgroundColor: '#007bff', padding: 10, borderRadius: 4, alignItems: 'center'
  },
  updateButton: {
    backgroundColor: '#17a2b8', padding: 10, borderRadius: 4, flex: 1,
    marginRight: 8, alignItems: 'center'
  },
  deleteButton: {
    backgroundColor: '#dc3545', padding: 10, borderRadius: 4,
    flex: 1, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  backButton: {
    backgroundColor: '#6c757d', padding: 12, borderRadius: 4,
    alignItems: 'center', marginTop: 16
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default ManageReviewsScreen;

