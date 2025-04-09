import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screen/HomeScreen';
import LoginScreen from './screen/LoginScreen';
import RegisterScreen from './screen/RegisterScreen';
import DashboardScreen from './screen/DashboardScreen';
import CreateRequestScreen from './screen/CreateRequestScreen';
import ViewRequestScreen from './screen/ViewRequestScreen';
import UpdateRequestScreen from './screen/UpdateRequestScreen';
import AcceptOrderScreen from './screen/AcceptOrderScreen';
import ManageReviewsScreen from './screen/ManageReviewsScreen';
import CreateReviewScreen from './screen/CreateReviewScreen';
import UpdateReviewScreen from './screen/UpdateReviewScreen';

import AcceptOrderScreen from './screen/AcceptOrderScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="CreateRequestScreen" component={CreateRequestScreen} />
        <Stack.Screen name="ViewRequestScreen" component={ViewRequestScreen} />
        <Stack.Screen name="UpdateRequestScreen" component={UpdateRequestScreen} options={{ title: 'Update Request' }} />
        <Stack.Screen name="AcceptOrderScreen" component={AcceptOrderScreen} />
        <Stack.Screen name="ManageReviews" component={ManageReviewsScreen} options={{ title: 'Manage Reviews' }} />
        <Stack.Screen name="CreateReview" component={CreateReviewScreen} options={{ title: 'Create Review' }} />
        <Stack.Screen name="UpdateReview" component={UpdateReviewScreen} options={{ title: 'Update Review' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
