import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/theme';
import { useTaskStore } from '../store';
import { useIdeaStore } from '../store';

import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import ScriptsScreen from '../screens/ScriptsScreen';
import IdeasScreen from '../screens/IdeasScreen';
import HabitsScreen from '../screens/HabitsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS = { Home: '⌂', Tasks: '✓', Scripts: '▶', Ideas: '◆', Habits: '●', Settings: '⚙' };

function TabBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function TabIcon({ route, focused }) {
  const activeTasks = useTaskStore(s => s.tasks.filter(t => !t.done).length);
  const activeIdeas = useIdeaStore(s => s.ideas.filter(i => !i.promoted).length);

  const badgeCount = route.name === 'Tasks' ? activeTasks
    : route.name === 'Ideas' ? activeIdeas
    : 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: focused ? Colors.accent : '#555' }}>
        {ICONS[route.name]}
      </Text>
      <TabBadge count={badgeCount} />
    </View>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon route={route} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 10,
              fontWeight: '500',
              color: focused ? Colors.accent : '#555',
            }}>
              {route.name}
            </Text>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Scripts" component={ScriptsScreen} />
        <Tab.Screen name="Ideas" component={IdeasScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
});
