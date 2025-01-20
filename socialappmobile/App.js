import React, { useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginScreen from './components/Auth/Login';
import RegisterScreen from './components/Auth/Register';
import ProfileScreen from './components/Profile/UserProfile';
import { MyUserContext, MyDispatchContext } from './configs/UserContext';
import MyUserReducer from './configs/UserReducers';
import HomeScreen from './components/Home/Home'; 

const Stack = createStackNavigator();

export default function App() {
  const initialState = null;
  const [user, dispatch] = useReducer(MyUserReducer, initialState);

  return (
    <PaperProvider>
      <NavigationContainer>
        <MyUserContext.Provider value={user}>
          <MyDispatchContext.Provider value={dispatch}>
            <Stack.Navigator initialRouteName="Login">
            
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
          </MyDispatchContext.Provider>
        </MyUserContext.Provider>
      </NavigationContainer>
    </PaperProvider>
  );
}
