import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screen/HomeScreen';
import LoginScreen from './screen/LoginScreen';
import RegisterScreen from './screen/RegisterScreen';
import DashboardScreen from './screen/DashboardScreen';
import CreateRequestScreen from './screen/CreateRequestScreen';
import ViewRequestScreen from './screen/ViewRequestScreen';
import AcceptOrderScreen from './screen/AcceptOrderScreen';
<<<<<<< HEAD
import NavigationToLocationScreen from "./screen/NavigationToLocationScreen";
=======
import CreateStoreRequestScreen from './screen/CreateStoreRequestScreen';
>>>>>>> be68378a (Separated requests created from wesdash and nearby stores)

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
        <Stack.Screen name="AcceptOrderScreen" component={AcceptOrderScreen} />
<<<<<<< HEAD
        <Stack.Screen name="NavigationToLocationScreen" component={NavigationToLocationScreen} />
=======
        <Stack.Screen name="CreateStoreRequestScreen" component={CreateStoreRequestScreen} />
>>>>>>> be68378a (Separated requests created from wesdash and nearby stores)
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
