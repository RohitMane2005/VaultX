import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Header } from '../components';
import {
  useTaskStore, useScriptStore, useIdeaStore, useHabitStore,
  exportAllData, importAllData, clearAllData,
} from '../store';

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const taskCount = useTaskStore(s => s.tasks.length);
  const scriptCount = useScriptStore(s => s.scripts.length);
  const ideaCount = useIdeaStore(s => s.ideas.length);
  const habitCount = useHabitStore(s => s.habits.length);
  const totalItems = taskCount + scriptCount + ideaCount + habitCount;

  const handleExport = async () => {
    try {
      setExporting(true);
      const json = await exportAllData();
      await Clipboard.setStringAsync(json);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Exported ✓', `All data (${totalItems} items) copied to clipboard.\n\nPaste it somewhere safe as a backup.`);
    } catch (e) {
      Alert.alert('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const clip = await Clipboard.getStringAsync();
      if (!clip || !clip.includes('vaultx-')) {
        Alert.alert('Invalid data', 'No valid VaultX backup found in clipboard.\n\nCopy a VaultX JSON backup first.');
        return;
      }
      Alert.alert(
        'Import data?',
        'This will replace ALL current data with the backup from clipboard. This cannot be undone.',
        [
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await importAllData(clip);
                Alert.alert('Imported ✓', 'Data restored. Restart the app to see changes.');
              } catch (e) {
                Alert.alert('Import failed', 'The clipboard data is corrupted or invalid.');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Delete ALL data?',
      `This will permanently remove ${totalItems} items across all modules. This cannot be undone.`,
      [
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Last chance — all tasks, scripts, ideas, and habits will be gone forever.',
              [
                {
                  text: 'Yes, delete all',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllData();
                    Alert.alert('Cleared ✓', 'All data deleted. Restart the app.');
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Header title="Settings" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* Data overview */}
        <Text style={st.sectionLabel}>DATA OVERVIEW</Text>
        <View style={st.card}>
          <View style={st.dataRow}>
            <Text style={st.dataLabel}>Tasks</Text>
            <Text style={st.dataValue}>{taskCount}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.dataRow}>
            <Text style={st.dataLabel}>Scripts</Text>
            <Text style={st.dataValue}>{scriptCount}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.dataRow}>
            <Text style={st.dataLabel}>Ideas</Text>
            <Text style={st.dataValue}>{ideaCount}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.dataRow}>
            <Text style={st.dataLabel}>Habits</Text>
            <Text style={st.dataValue}>{habitCount}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.dataRow}>
            <Text style={[st.dataLabel, { fontWeight: '700' }]}>Total</Text>
            <Text style={[st.dataValue, { color: Colors.accent, fontWeight: '700' }]}>{totalItems}</Text>
          </View>
        </View>

        {/* Backup & Restore */}
        <Text style={st.sectionLabel}>BACKUP & RESTORE</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.menuItem} onPress={handleExport} disabled={exporting}>
            <Text style={st.menuIcon}>📤</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.menuTitle}>Export data</Text>
              <Text style={st.menuDesc}>Copy all data as JSON to clipboard</Text>
            </View>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.menuItem} onPress={handleImport} disabled={importing}>
            <Text style={st.menuIcon}>📥</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.menuTitle}>Import data</Text>
              <Text style={st.menuDesc}>Restore from JSON in clipboard</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <Text style={st.sectionLabel}>DANGER ZONE</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.menuItem} onPress={handleClearAll}>
            <Text style={st.menuIcon}>🗑️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[st.menuTitle, { color: Colors.priorityHigh }]}>Clear all data</Text>
              <Text style={st.menuDesc}>Permanently delete everything</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={st.sectionLabel}>ABOUT</Text>
        <View style={st.card}>
          <View style={st.aboutRow}>
            <Text style={st.aboutLogo}>vault<Text style={{ color: Colors.accent }}>x</Text></Text>
            <Text style={st.aboutVersion}>v1.0.0</Text>
          </View>
          <Text style={st.aboutDesc}>
            Your personal productivity vault — tasks, scripts, ideas, and habits in one place.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 0 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
  },
  dataLabel: { fontSize: 14, color: Colors.textPrimary },
  dataValue: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: { fontSize: 20 },
  menuTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  aboutLogo: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  aboutVersion: { fontSize: 12, color: Colors.textMuted },
  aboutDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
