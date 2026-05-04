import 'react-native-gesture-handler';
import React from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

import { BooksProvider } from './src/context/BooksContext';
import { BookmarksProvider } from './src/context/BookmarksContext';

import HomeScreen from './src/screens/HomeScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import AdminScreen from './src/screens/AdminScreen';

import { COLORS, FONT_SIZES } from './src/theme';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();
const BookmarksStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

function LibraryNavigator() {
  return (
    <LibraryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <LibraryStack.Screen name="Home" component={HomeScreen} />
      <LibraryStack.Screen name="BookDetail" component={BookDetailScreen} />
      <LibraryStack.Screen name="Reader" component={ReaderScreen} />
    </LibraryStack.Navigator>
  );
}

function BookmarksNavigator() {
  return (
    <BookmarksStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <BookmarksStack.Screen name="BookmarksList" component={BookmarksScreen} />
      <BookmarksStack.Screen name="Reader" component={ReaderScreen} />
    </BookmarksStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AdminStack.Screen name="AdminMain" component={AdminScreen} />
    </AdminStack.Navigator>
  );
}

export default function App() {
  return (
    <BooksProvider>
      <BookmarksProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: COLORS.backgroundCard,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
              },
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarLabelStyle: {
                fontSize: FONT_SIZES.xs,
                fontWeight: '600',
              },
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Library') {
                  iconName = focused ? 'library' : 'library-outline';
                } else if (route.name === 'Bookmarks') {
                  iconName = focused ? 'bookmarks' : 'bookmarks-outline';
                } else if (route.name === 'Admin') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen
              name="Library"
              component={LibraryNavigator}
              options={{ title: 'ספרייה' }}
            />
            <Tab.Screen
              name="Bookmarks"
              component={BookmarksNavigator}
              options={{ title: 'סימניות' }}
            />
            <Tab.Screen
              name="Admin"
              component={AdminNavigator}
              options={{ title: 'ניהול' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </BookmarksProvider>
    </BooksProvider>
  );
}
