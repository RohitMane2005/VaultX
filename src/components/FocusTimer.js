// src/components/FocusTimer.js — Pomodoro Focus Timer Modal
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useFocusStore } from '../store';

const PRESETS = [
  { label: 'Focus', minutes: 25, type: 'work', color: Colors.accent },
  { label: 'Short', minutes: 5, type: 'shortBreak', color: Colors.statusReady },
  { label: 'Long', minutes: 15, type: 'longBreak', color: Colors.statusScheduled },
];

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FocusTimer({ visible, onClose }) {
  const { addSession, getTodayWorkMinutes } = useFocusStore();
  const todaySessions = useFocusStore(s =>
    s.sessions.filter(ss => new Date(ss.completedAt).toDateString() === new Date().toDateString() && ss.type === 'work')
  );

  const [preset, setPreset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef(null);
  const presetRef = useRef(PRESETS[0]);

  const currentPreset = PRESETS[preset];
  presetRef.current = currentPreset;
  const totalSeconds = currentPreset.minutes * 60;
  const progress = 1 - timeLeft / totalSeconds;

  const switchPreset = useCallback((idx) => {
    Haptics.selectionAsync();
    setPreset(idx);
    setTimeLeft(PRESETS[idx].minutes * 60);
    setRunning(false);
    setCompleted(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            // Session complete — use ref to avoid stale closure
            const p = presetRef.current;
            addSession({ duration: p.minutes, type: p.type });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([0, 400, 200, 400]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (completed) {
      // Reset
      setTimeLeft(totalSeconds);
      setCompleted(false);
      return;
    }
    setRunning(!running);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRunning(false);
    setCompleted(false);
    setTimeLeft(totalSeconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleClose = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  };

  const todayMins = getTodayWorkMinutes();
  const todayCount = todaySessions.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={st.bg}>
        <View style={st.container}>
          {/* Header */}
          <View style={st.header}>
            <Text style={st.title}>Focus Timer</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={st.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Preset tabs */}
          <View style={st.presetRow}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[st.presetTab, preset === i && { backgroundColor: p.color + '20', borderColor: p.color }]}
                onPress={() => switchPreset(i)}
              >
                <Text style={[st.presetText, preset === i && { color: p.color }]}>{p.label}</Text>
                <Text style={[st.presetMins, preset === i && { color: p.color }]}>{p.minutes}m</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Timer display */}
          <View style={st.timerWrap}>
            {/* Progress ring background */}
            <View style={[st.ring, { borderColor: currentPreset.color + '15' }]}>
              {/* Progress indicator */}
              <View style={[st.ringProgress, {
                borderColor: currentPreset.color,
                borderTopColor: progress > 0.25 ? currentPreset.color : 'transparent',
                borderRightColor: progress > 0.5 ? currentPreset.color : 'transparent',
                borderBottomColor: progress > 0.75 ? currentPreset.color : 'transparent',
                borderLeftColor: progress > 0 ? currentPreset.color : 'transparent',
                transform: [{ rotate: `${progress * 360}deg` }],
              }]} />
              <Text style={[st.time, { color: currentPreset.color }]}>{formatTime(timeLeft)}</Text>
              <Text style={st.timerLabel}>
                {completed ? '🎉 Done!' : running ? currentPreset.label.toUpperCase() : 'READY'}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={st.controls}>
            <TouchableOpacity style={st.resetBtn} onPress={resetTimer}>
              <Text style={st.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.mainBtn, { backgroundColor: currentPreset.color }]}
              onPress={toggleTimer}
            >
              <Text style={st.mainBtnText}>
                {completed ? 'Restart' : running ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.resetBtn}
              onPress={() => {
                const nextIdx = (preset + 1) % PRESETS.length;
                switchPreset(nextIdx);
              }}
            >
              <Text style={st.resetText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Today stats */}
          <View style={st.statsRow}>
            <View style={st.statItem}>
              <Text style={[st.statNum, { color: Colors.accent }]}>{todayCount}</Text>
              <Text style={st.statLabel}>Sessions</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Text style={[st.statNum, { color: Colors.accent }]}>{todayMins}</Text>
              <Text style={st.statLabel}>Minutes</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Text style={[st.statNum, { color: Colors.accent }]}>{Math.round(todayMins / 60 * 10) / 10}</Text>
              <Text style={st.statLabel}>Hours</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: { fontSize: 16, color: Colors.textMuted, fontWeight: '700' },

  presetRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  presetTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  presetText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  presetMins: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  timerWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
  },
  time: { fontSize: 48, fontWeight: '200', letterSpacing: 2 },
  timerLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 4, letterSpacing: 1 },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: Spacing.xl },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
  },
  resetText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  mainBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
});
