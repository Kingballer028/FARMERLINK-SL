import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BuyerHomeScreen from '../screens/BuyerHomeScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BuyerActiveOrdersScreen from '../screens/BuyerActiveOrdersScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';
import FarmerOrdersScreen from '../screens/FarmerOrdersScreen';
import FarmerDeliveredScreen from '../screens/FarmerDeliveredScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const BuyerTabs = () => {
  const { cartCount } = useContext(CartContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Cart') iconName = 'cart';
          else if (route.name === 'ActiveOrders') iconName = 'list';
          else if (route.name === 'History') iconName = 'time';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={BuyerHomeScreen} options={{ title: 'Marketplace' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tab.Screen name="ActiveOrders" component={BuyerActiveOrdersScreen} options={{ title: 'Active Orders' }} />
      <Tab.Screen name="History" component={OrderHistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const FarmerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName: any;
        if (route.name === 'Dashboard') iconName = 'grid';
        else if (route.name === 'Orders') iconName = 'list';
        else if (route.name === 'History') iconName = 'time';
        else if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#f57c00',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Dashboard" component={FarmerDashboardScreen} options={{ title: 'My Products' }} />
    <Tab.Screen name="Orders" component={FarmerOrdersScreen} options={{ title: 'Active Orders' }} />
    <Tab.Screen name="History" component={FarmerDeliveredScreen} options={{ title: 'History' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const MainStack = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'farmer' ? (
        <>
          <Stack.Screen name="FarmerTabs" component={FarmerTabs} />
          <Stack.Screen
            name="AddEditProduct"
            component={AddEditProductScreen}
            options={{ headerShown: true, title: 'Manage Product' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ headerShown: true, title: 'Product Details' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ headerShown: true, title: 'Checkout' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // Or a splash screen component
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
