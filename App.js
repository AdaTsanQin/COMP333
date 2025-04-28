// App.js – final merge (Chat + Map Navigation + Checkout)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

/* ---------- screens ---------- */
import HomeScreen                 from './screen/HomeScreen';
import LoginScreen                from './screen/LoginScreen';
import RegisterScreen             from './screen/RegisterScreen';
import DashboardScreen            from './screen/DashboardScreen';

import CreateRequestScreen        from './screen/CreateRequestScreen';
import CreateStoreRequestScreen   from './screen/CreateStoreRequestScreen';
import ViewRequestScreen          from './screen/ViewRequestScreen';
import AcceptOrderScreen          from './screen/AcceptOrderScreen';

import SearchScreen               from './screen/SearchScreen';
import CheckoutScreen             from './screen/CheckoutScreen';


import OrderDetailsScreen         from './screen/OrderDetailsScreen';   // 新增
import CustomOrderScreen          from './screen/CustomOrderScreen';
import ChatListScreen             from './screen/ChatListScreen';
import ChatScreen                 from './screen/ChatScreen';

import CreateReviewScreen           from './screen/CreateReviewScreen.js'
import ManageReviewsScreen         from './screen/ManageReviewsScreen.js'
import UpdateReviewScreen          from './UpdateReviewScreen.js'
import NavigationToLocationScreen from './screen/NavigationToLocationScreen';   // map + navigate

/* ---------- navigator ---------- */
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* auth */}
        <Stack.Screen name="Home"     component={HomeScreen} />
        <Stack.Screen name="Login"    component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* dashboard */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* user flow */}
        <Stack.Screen name="CreateRequestScreen"      component={CreateRequestScreen} />
        <Stack.Screen name="CreateStoreRequestScreen" component={CreateStoreRequestScreen} />
        <Stack.Screen name="ViewRequestScreen"        component={ViewRequestScreen} />

        {/* dasher flow */}
        <Stack.Screen name="AcceptOrderScreen" component={AcceptOrderScreen} />

        {/* product search & checkout */}
        <Stack.Screen name="SearchScreen"   component={SearchScreen} />
        <Stack.Screen name="Checkout"       component={CheckoutScreen} />
        <Stack.Screen name="OrderDetails"   component={OrderDetailsScreen} />
        <Stack.Screen name="CustomOrder"    component={CustomOrderScreen} />
        {/* chat */}
        <Stack.Screen name="Chats" component={ChatListScreen} />
        <Stack.Screen name="Chat"  component={ChatScreen} />

        {/* map navigation */}
        <Stack.Screen
          name="NavigationToLocationScreen"
          component={NavigationToLocationScreen}
          options={{ title: 'Navigation' }}
        />
        
        {/* Review screens */}
        <Stack.Screen name="CreateReviewScreen" component={CreateReviewScreen} />
        <Stack.Screen name="UpdateReview" component={UpdateReviewScreen} options={{ title: 'Update Review' }} />
        <Stack.Screen name="ManageReviewsScreen" component={ManageReviewsScreen} options={{ title: 'Manage Reviews' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
