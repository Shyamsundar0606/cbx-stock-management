import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ProductsScreen } from './screens/ProductsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DetailScreen } from './screens/DetailScreen';
import { FormScreen } from './screens/FormScreen';
import { StackParams } from './types';
import { colors } from './components/ui';
const Stack = createNativeStackNavigator<StackParams>();
const Tabs = createBottomTabNavigator();
function Home() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerTitle: 'CBX Stock',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 16,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 23 }}>{route.name === 'Products' ? '▦' : '▥'}</Text>
        ),
      })}
    >
      <Tabs.Screen name="Products" component={ProductsScreen} />
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
    </Tabs.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ title: 'Product details' }}
          />
          <Stack.Screen
            name="Form"
            component={FormScreen}
            options={({ route }) => ({
              title: route.params?.id ? 'Edit product' : 'Add product',
              gestureEnabled: false,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
