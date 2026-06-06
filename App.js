import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Hide the Android system navigation bar for immersive experience
      NavigationBar.setVisibilityAsync('hidden');
      // Allow the user to swipe from the edge to temporarily reveal the nav bar
      NavigationBar.setBehaviorAsync('overlay-swipe');
      // Set nav bar color to match app background in case it briefly shows
      NavigationBar.setBackgroundColorAsync('#0d0d0d');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0d0d0d" translucent />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
