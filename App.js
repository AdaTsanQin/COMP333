// App.js  – final merge (Chat + Map Navigation)
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

import ChatListScreen             from './screen/ChatListScreen';
import ChatScreen                 from './screen/ChatScreen';

import NavigationToLocationScreen from './screen/NavigationToLocationScreen';   // map + navigate

/* ---------- navigator ---------- */
const Stack = createStackNavigator();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      {/* auth */}
      <Stack.Screen name="Home"     component={HomeScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* dashboard */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />

      {/* user flow */}
      <Stack.Screen name="CreateRequestScreen"        component={CreateRequestScreen} />
      <Stack.Screen name="CreateStoreRequestScreen"   component={CreateStoreRequestScreen} />
      <Stack.Screen name="ViewRequestScreen"          component={ViewRequestScreen} />

      {/* dasher flow */}
      <Stack.Screen name="AcceptOrderScreen" component={AcceptOrderScreen} />

      {/* product search */}
      <Stack.Screen name="SearchScreen" component={SearchScreen} />

      {/* chat */}
      <Stack.Screen name="Chats" component={ChatListScreen} />
      <Stack.Screen name="Chat"  component={ChatScreen} />

      {/* map navigation */}
      <Stack.Screen
        name="NavigationToLocationScreen"
        component={NavigationToLocationScreen}
        options={{ title: 'Navigation' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;

