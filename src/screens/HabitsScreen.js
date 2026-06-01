import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Card, Section, Empty, Header, Field } from '../components';
import { useHabitStore } from '../store';

const EMOJIS = ['🏋️', '📚', '🎯', '💻', '🎬', '✍️', '🧘', '🏃', '💡', '🎵', '💧', '☕'];
const COLORS = ['#e03c3c', '#e6a817', '#2faa4f', '#5b8af5', '#a78bfa', '#f472b6', '#fb923c', '#14b8a6'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + diff + i);
    return d;
  });
}

export default function HabitsScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const { habits, toggleToday, deleteHabit, getStreak, getBestStreak } = useHabitStore();

  const todayStr = new Date().toDateString();
  const todayCount = habits.filter(h =>
    h.completedDates.some(d => new Date(d).toDateString() === todayStr)
  ).length;

  const totalCompletions = useMemo(() =>
    habits.reduce((sum, h) => sum + h.completedDates.length, 0),
    [habits]
  );

  const bestStreak = useMemo(() =>
    habits.reduce((best, h) => Math.max(best, getBestStreak(h.id)), 0),
    [habits]
  );

  const handleDelete = (h) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(`Delete "${h.name}"?`, 'All tracking data will be lost.', [
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(h.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Header
        title="Habits"
        right={
          <TouchableOpacity style={st.addBtn} onPress={() => setModalOpen(true)}>
            <Text style={st.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Stats */}
      {habits.length > 0 && (
        <View style={st.stats}>
          <View style={st.statBox}>
            <Text style={st.statVal}>{todayCount}/{habits.length}</Text>
            <Text style={st.statLbl}>Today</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statVal}>
              {habits.length > 0 ? Math.round((todayCount / habits.length) * 100) : 0}%
            </Text>
            <Text style={st.statLbl}>Rate</Text>
          </View>
          <View style={st.statBox}>
            <Text style={[st.statVal, { color: bestStreak > 0 ? Colors.accent : Colors.textPrimary }]}>
              {bestStreak}d
            </Text>
            <Text style={st.statLbl}>Best</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statVal}>{totalCompletions}</Text>
            <Text style={st.statLbl}>Total</Text>
          </View>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <Empty
            title="No habits yet"
            subtitle="Track daily habits and build streaks."
            action="Add Habit"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <>
            <Section title="This week" count={habits.length} />
            {habits.map(h => (
              <HabitRow
                key={h.id}
                habit={h}
                streak={getStreak(h.id)}
                onToggle={() => toggleToday(h.id)}
                onDelete={() => handleDelete(h)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <AddHabitModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </SafeAreaView>
  );
}

/* ── Habit row ───────────────────────────────────────────────────────────── */
function HabitRow({ habit, streak, onToggle, onDelete }) {
  const week = getWeekDates();
  const todayStr = new Date().toDateString();
  const color = habit.color || Colors.accent;

  const isDone = (d) => habit.completedDates.some(cd => new Date(cd).toDateString() === d.toDateString());

  return (
    <View style={st.habitCard}>
      <View style={st.habitTop}>
        <View style={st.habitInfo}>
          <Text style={st.habitIcon}>{habit.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.habitName}>{habit.name}</Text>
            <Text style={[st.habitStreak, { color: streak > 0 ? color : Colors.textMuted }]}>
              {streak > 0 ? `${streak} day streak 🔥` : 'No streak yet'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={st.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={st.weekRow}>
        {week.map((d, i) => {
          const done = isDone(d);
          const isToday = d.toDateString() === todayStr;
          const future = d > new Date() && !isToday;
          return (
            <TouchableOpacity
              key={i}
              style={[
                st.dot,
                done && { backgroundColor: color, borderColor: color },
                isToday && !done && { borderColor: color },
                future && { opacity: 0.3 },
              ]}
              onPress={isToday ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(); } : undefined}
              disabled={future}
            >
              <Text style={[st.dotText, done && { color: '#fff' }]}>
                {done ? '✓' : DAYS[i]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ── Add Habit Modal ─────────────────────────────────────────────────────── */
function AddHabitModal({ visible, onClose }) {
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#e03c3c');

  React.useEffect(() => {
    if (visible) { setName(''); setIcon('🎯'); setColor('#e03c3c'); }
  }, [visible]);

  const save = () => {
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalBg}>
        <View style={st.modal}>
          <Text style={st.modalTitle}>New habit</Text>

          <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Workout, LeetCode..." autoFocus />

          <Text style={st.label}>Icon</Text>
          <View style={st.grid}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[st.gridItem, icon === e && { borderColor: color, backgroundColor: color + '15' }]}
                onPress={() => setIcon(e)}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.label}>Color</Text>
          <View style={st.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[st.colorDot, { backgroundColor: c }, color === c && { borderWidth: 2, borderColor: '#fff' }]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <View style={st.modalBtns}>
            <TouchableOpacity style={st.btnCancel} onPress={onClose}>
              <Text style={st.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.btnSave, !name.trim() && { opacity: 0.4 }]} onPress={save}>
              <Text style={st.btnSaveText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.sm },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  content: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },

  stats: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  habitCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  habitTop: { marginBottom: Spacing.md },
  habitInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  habitIcon: { fontSize: 22 },
  habitName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  habitStreak: { fontSize: 11, marginTop: 1 },
  deleteIcon: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: {
    width: 36, height: 36, borderRadius: Radius.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  dotText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: Spacing.xl, paddingBottom: 32 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  gridItem: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  btnCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.card, alignItems: 'center' },
  btnCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  btnSave: { flex: 2, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.accent, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
