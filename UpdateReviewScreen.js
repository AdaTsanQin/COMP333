import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const UpdateReviewScreen = () => {
  const [task, setTask] = useState(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params;
  
  useEffect(() => {
    fetchTaskDetails();
  }, []);
  
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/task_details.php?PHPSESSID=${sessionId}&task_id=${taskId}` 
        : `http://10.0.2.2/WesDashAPI/task_details.php?task_id=${taskId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      console.log('Raw task details response:', text);
      
      try {
        const data = JSON.parse(text);
        if (data.success) {
          setTask(data.task);
          
          // Set current values from the task
          setRating(data.task.rating ? data.task.rating.toString() : '');
          setComment(data.task.comment || '');
          
          // Check if task doesn't have a review yet
          if (!data.task.comment || data.task.comment.trim() === '') {
            Alert.alert(
              'No Review',
              'This task doesn\'t have a review yet. You will be redirected to create a review.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.replace('CreateReview', { taskId })
                }
              ]
            );
          }
        } else {
          Alert.alert('Error', data.message || 'Failed to load task details');
          navigation.goBack();
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('Error', 'Unexpected response from server');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Network request failed');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    // Validate inputs
    if (!rating.trim()) {
      Alert.alert('Error', 'Please enter a rating');
      return;
    }
    
    const ratingNumber = parseInt(rating, 10);
    if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      Alert.alert('Error', 'Rating must be a number between 1 and 5');
      return;
    }
    
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get the session ID from storage
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      
      // Construct URL with session ID if available
      const url = sessionId 
        ? `http://10.0.2.2/WesDashAPI/update_review.php?PHPSESSID=${sessionId}` 
        : 'http://10.0.2.2/WesDashAPI/update_review.php';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          rating: ratingNumber,
          comment: comment
        }),
      });
      
      const text = await response.text();
      console.log('Raw update review response:', text);
      
      try {
        const data = JSON.parse(text);
        if (data.success) {
          Alert.alert(
            'Success',
            'Review updated successfully',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('ManageReviews')
              }
            ]
          );
        } else {
          Alert.alert('Error', data.message || 'Failed to update review');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'Network request failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading review details...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Update Review</Text>
        
        {task && (
          <View style={styles.taskInfoCard}>
            <Text style={styles.taskId}>Task ID: {task.task_id}</Text>
            <Text style={styles.taskDetail}>Item: {task.item}</Text>
            <Text style={styles.taskDetail}>Dasher: {task.dashername}</Text>
            <Text style={styles.taskDetail}>Status: {task.status}</Text>
          </View>
        )}
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Rating (1-5):</Text>
          <TextInput
            style={styles.ratingInput}
            value={rating}
            onChangeText={setRating}
            placeholder="Enter a number between 1-5"
            keyboardType="number-pad"
            maxLength={1}
          />
          
          <Text style={styles.label}>Your Review:</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Write your review here..."
            multiline
            textAlignVertical="top"
          />
          
          {submitting ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.submittingIndicator} />
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Update Review</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskInfoCard: {
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
  taskId: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  taskDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    height: 120,
    fontSize: 16,
  },
  submittingIndicator: {
    marginVertical: 16,
  },
  submitButton: {
    backgroundColor: '#17a2b8',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UpdateReviewScreen;