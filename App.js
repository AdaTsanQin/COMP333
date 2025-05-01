import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';

/* ---------- screens ---------- */

import HomeScreen                   from './screen/HomeScreen';
import LoginScreen                  from './screen/LoginScreen';
import RegisterScreen               from './screen/RegisterScreen';
import DashboardScreen              from './screen/DashboardScreen';
import CreateRequestScreen          from './screen/CreateRequestScreen';
import CreateStoreRequestScreen     from './screen/CreateStoreRequestScreen';
import ViewRequestScreen            from './screen/ViewRequestScreen';
import AcceptOrderScreen            from './screen/AcceptOrderScreen';
import SearchScreen                 from './screen/SearchScreen';
import CheckoutScreen               from './screen/CheckoutScreen';
import OrderDetailsScreen           from './screen/OrderDetailsScreen';
import CustomOrderScreen            from './screen/CustomOrderScreen';
import ChatListScreen               from './screen/ChatListScreen';
import ChatScreen                   from './screen/ChatScreen';
import BillScreen                   from './screen/BillScreen';       
import TipScreen                    from './screen/TipScreen';
import NavigationToLocationScreen   from './screen/NavigationToLocationScreen';
import RechargeScreen               from './screen/RechargeScreen';
import PriceReceiptScreen           from './screen/PriceReceiptScreen'; 
import DropOffScreen                from './screen/DropOffScreen';

import CreateReviewScreen           from './screen/CreateReviewScreen.js'
import ManageReviewsScreen         from './screen/ManageReviewsScreen.js'
import UpdateReviewScreen          from './screen/UpdateReviewScreen.js'

import GetLocationScreen            from './screen/GetLocationScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51RHZhMPc03iVa9PcKNScJuTXqDGzFvCdgfHfYp292RAIPDc8vk0Lw81L3CerFMVWcYNlDid6PhLRALhuSwtG5EVQ00SmY5dCpi">
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          {/* authentication */}
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
          <Stack.Screen name="PriceReceiptScreen" component={PriceReceiptScreen} />
          <Stack.Screen name="DropOffScreen" component={DropOffScreen} />
          {/* product search & checkout */}
          <Stack.Screen name="SearchScreen"   component={SearchScreen} />
          <Stack.Screen name="Checkout"       component={CheckoutScreen} />
          <Stack.Screen name="OrderDetails"   component={OrderDetailsScreen} />
          <Stack.Screen name="CustomOrder"    component={CustomOrderScreen} />

          {/* chat */}
          <Stack.Screen name="Chats" component={ChatListScreen} />
          <Stack.Screen name="Chat"  component={ChatScreen} />

          {/* bill & tip */}
          <Stack.Screen name="BillScreen" component={BillScreen} />
          <Stack.Screen name="TipScreen"  component={TipScreen}  />

          {/* recharge */}
          <Stack.Screen name="RechargeScreen" component={RechargeScreen} />

          <Stack.Screen name="GetLocationScreen" component={GetLocationScreen} />

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
    </StripeProvider>

  );
}
