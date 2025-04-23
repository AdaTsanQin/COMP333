import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

/* --- 页面组件 --- */
import HomeScreen               from './screen/HomeScreen';
import LoginScreen              from './screen/LoginScreen';
import RegisterScreen           from './screen/RegisterScreen';
import DashboardScreen          from './screen/DashboardScreen';
import CreateRequestScreen      from './screen/CreateRequestScreen';
import ViewRequestScreen        from './screen/ViewRequestScreen';
import AcceptOrderScreen        from './screen/AcceptOrderScreen';
import SearchScreen             from './screen/SearchScreen';
import CreateStoreRequestScreen from './screen/CreateStoreRequestScreen';
import ChatScreen               from './screen/ChatScreen';
import ChatListScreen           from './screen/ChatListScreen';   // new

const Stack = createStackNavigator();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <React.Fragment>
        <Stack.Screen name="Home"                   component={HomeScreen} />
        <Stack.Screen name="Login"                  component={LoginScreen} />
        <Stack.Screen name="Register"               component={RegisterScreen} />
        <Stack.Screen name="Dashboard"              component={DashboardScreen} />

        {/* 用户下单 */}
        <Stack.Screen name="CreateRequestScreen"      component={CreateRequestScreen} />
        <Stack.Screen name="CreateStoreRequestScreen" component={CreateStoreRequestScreen} />

        {/* 列表 / 接单 */}
        <Stack.Screen name="ViewRequestScreen"      component={ViewRequestScreen} />
        <Stack.Screen name="AcceptOrderScreen"      component={AcceptOrderScreen} />

        {/* 商品搜索 */}
        <Stack.Screen name="SearchScreen"           component={SearchScreen} />

        {/* 聊天相关 */}
        <Stack.Screen name="Chats"                  component={ChatListScreen} />
        <Stack.Screen name="Chat"                   component={ChatScreen} />
      </React.Fragment>
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;
