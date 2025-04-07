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
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const ManageReviewsScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/manage_review.php?PHPSESSID=${sessionId}` 
        : 'http://10.0.2.2/WesDashAPI/manage_review.php';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      try {
        const data = JSON.parse(text);
        if (data.success) {
          setTasks(data.tasks || []);
        } else {
          console.error('Failed to fetch tasks:', data.message);
          Alert.alert('Error', data.message || 'Failed to load completed tasks');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Network request failed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCompletedTasks();
      return () => {}; // cleanup function
    }, [])
  );

  const handleCreateReview = (taskId) => {
    navigation.navigate('CreateReview', { taskId });
  };

  const handleUpdateReview = (taskId) => {
    navigation.navigate('UpdateReview', { taskId });
  };

  const handleDeleteReview = (taskId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the session ID from storage
              const sessionId = await AsyncStorage.getItem('PHPSESSID');
              
              // Construct URL with session ID if available
              const url = sessionId 
                ? `http://10.0.2.2/WesDashAPI/delete_review.php?PHPSESSID=${sessionId}` 
                : 'http://10.0.2.2/WesDashAPI/delete_review.php';
              
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task_id: taskId }),
              });
              
              const text = await response.text();
              console.log('Raw delete response:', text);
              
              try {
                const data = JSON.parse(text);
                if (data.success) {
                  Alert.alert('Success', 'Review deleted successfully');
                  fetchCompletedTasks(); // Refresh the list
                } else {
                  Alert.alert('Error', data.message || 'Failed to delete review');
                }
              } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                Alert.alert('Error', 'Unexpected response from server');
              }
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Network request failed');
            }
          }
        },
      ]
    );
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
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => handleCreateReview(item.task_id)}
            >
              <Text style={styles.buttonText}>Create Review</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => handleUpdateReview(item.task_id)}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteReview(item.task_id)}
              >
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
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 50,
  },
  listContainer: {
    paddingBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  taskStatus: {
    backgroundColor: '#28a745',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  taskInfo: {
    marginBottom: 12,
  },
  reviewInfo: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reviewTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noReview: {
    fontStyle: 'italic',
    color: '#6c757d',
    marginBottom: 12,
  },
  actionButtons: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ManageReviewsScreen;