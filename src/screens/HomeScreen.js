import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Card, Section, SearchBar, Empty, Check } from '../components';
import FocusTimer from '../components/FocusTimer';
import {
  useTaskStore, useScriptStore, useIdeaStore, useHabitStore, useFocusStore,
} from '../store';

/* ── Motivational Quotes ──────────────────────────────────────────────────── */
const QUOTES = [
  { text: "Ship fast, iterate faster.", author: "Startup wisdom" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Consistency beats intensity.", author: "Anonymous" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
];

function getTodayQuote() {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Night owl? 🦉';
  if (hour < 12) return 'Good morning ☀️';
  if (hour < 17) return 'Good afternoon 🌤️';
  if (hour < 21) return 'Good evening 🌙';
  return 'Burning the midnight oil 🔥';
}

function formatDate() {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const [focusOpen, setFocusOpen] = useState(false);

  const { tasks, toggleDone } = useTaskStore();
  const { scripts } = useScriptStore();
  const { ideas, addIdea } = useIdeaStore();
  const { habits, getStreak } = useHabitStore();
  const { getTodayWorkMinutes } = useFocusStore();
  const focusSessions = useFocusStore(s =>
    s.sessions.filter(ss => new Date(ss.completedAt).toDateString() === new Date().toDateString() && ss.type === 'work')
  );

  const today = new Date().toDateString();
  const activeTasks = tasks.filter(t => !t.done);
  const todayTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
  const draftCount = scripts.filter(s => s.status === 'draft').length;
  const habitsToday = habits.filter(h =>
    h.completedDates.some(d => new Date(d).toDateString() === today)
  ).length;

  const quote = useMemo(() => getTodayQuote(), []);

  // Overdue tasks
  const overdueTasks = useMemo(() =>
    tasks.filter(t => {
      if (t.done || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return due < now && due.toDateString() !== now.toDateString();
    }).slice(0, 3),
    [tasks]
  );

  // Top streaks
  const topStreaks = useMemo(() =>
    habits
      .map(h => ({ ...h, streak: getStreak(h.id) }))
      .filter(h => h.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 4),
    [habits]
  );

  // Recent items (last 5 created across all stores)
  const recentItems = useMemo(() => {
    const all = [
      ...tasks.slice(0, 3).map(t => ({ ...t, _t: 'task', _time: t.createdAt })),
      ...scripts.slice(0, 3).map(s => ({ ...s, _t: 'script', _time: s.createdAt })),
      ...ideas.slice(0, 3).map(i => ({ ...i, _t: 'idea', _time: i.createdAt, title: i.content })),
    ];
    return all
      .sort((a, b) => new Date(b._time) - new Date(a._time))
      .slice(0, 5);
  }, [tasks, scripts, ideas]);

  // search
  const results = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return [
      ...tasks.filter(t => t.title.toLowerCase().includes(q)).map(t => ({ ...t, _t: 'task' })),
      ...scripts.filter(s => (s.title + s.hook).toLowerCase().includes(q)).map(s => ({ ...s, _t: 'script' })),
      ...ideas.filter(i => i.content.toLowerCase().includes(q)).map(i => ({ ...i, _t: 'idea' })),
    ].slice(0, 15);
  }, [search, tasks, scripts, ideas]);

  const handleCapture = () => {
    if (!captureText.trim()) return;
    addIdea({ content: captureText.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCaptureText('');
    setCaptureOpen(false);
  };

  const pinned = useMemo(() => [
    ...tasks.filter(t => t.pinned).map(t => ({ ...t, _t: 'task' })),
    ...scripts.filter(s => s.pinned).map(s => ({ ...s, _t: 'script' })),
  ], [tasks, scripts]);

  // Completion percentage
  const completionPct = tasks.length > 0
    ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
    : 0;

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Logo */}
      <View style={st.topBar}>
        <Text style={st.logo}>Vault<Text style={{ color: Colors.accent }}>ora</Text></Text>
        <TouchableOpacity style={st.captureBtn} onPress={() => setCaptureOpen(true)}>
          <Text style={st.captureBtnText}>+ Idea</Text>
        </TouchableOpacity>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks, scripts, ideas..." />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {results ? (
          <>
            <Section title="Results" count={results.length} />
            {results.length === 0 ? (
              <Empty title="Nothing found" />
            ) : results.map(item => (
              <Card key={item.id} onPress={() => {
                if (item._t === 'task') navigation.navigate('Tasks');
                else if (item._t === 'script') navigation.navigate('Scripts');
                else navigation.navigate('Ideas');
              }}>
                <Text style={st.resultType}>{item._t.toUpperCase()}</Text>
                <Text style={st.resultTitle}>{item.title || item.content}</Text>
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* ── Greeting & Date ─────────────────────────────────── */}
            <View style={st.greetingWrap}>
              <Text style={st.greeting}>{getGreeting()}</Text>
              <Text style={st.dateText}>{formatDate()}</Text>
            </View>

            {/* ── Daily Quote ─────────────────────────────────────── */}
            <View style={st.quoteCard}>
              <Text style={st.quoteIcon}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.quoteText}>"{quote.text}"</Text>
                <Text style={st.quoteAuthor}>— {quote.author}</Text>
              </View>
            </View>

            {/* ── Quick stats ──────────────────────────────────────── */}
            <View style={st.statsRow}>
              <TouchableOpacity style={st.stat} onPress={() => navigation.navigate('Tasks')}>
                <Text style={st.statNum}>{activeTasks.length}</Text>
                <Text style={st.statLabel}>Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.stat} onPress={() => navigation.navigate('Scripts')}>
                <Text style={st.statNum}>{draftCount}</Text>
                <Text style={st.statLabel}>Drafts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.stat} onPress={() => navigation.navigate('Habits')}>
                <Text style={st.statNum}>{habitsToday}/{habits.length}</Text>
                <Text style={st.statLabel}>Habits</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.stat} onPress={() => navigation.navigate('Ideas')}>
                <Text style={st.statNum}>{ideas.filter(i => !i.promoted).length}</Text>
                <Text style={st.statLabel}>Ideas</Text>
              </TouchableOpacity>
            </View>

            {/* ── Focus Timer Card ──────────────────────────────────── */}
            <TouchableOpacity style={st.focusCard} onPress={() => setFocusOpen(true)} activeOpacity={0.8}>
              <View style={st.focusLeft}>
                <Text style={st.focusIcon}>🎯</Text>
                <View>
                  <Text style={st.focusTitle}>Focus Timer</Text>
                  <Text style={st.focusSubtitle}>
                    {focusSessions.length > 0
                      ? `${focusSessions.length} sessions · ${getTodayWorkMinutes()}min today`
                      : 'Start a Pomodoro session'}
                  </Text>
                </View>
              </View>
              <Text style={st.focusArrow}>▶</Text>
            </TouchableOpacity>

            {/* ── Progress bar ─────────────────────────────────────── */}
            {tasks.length > 0 && (
              <View style={st.progressWrap}>
                <View style={st.progressHeader}>
                  <Text style={st.progressLabel}>Overall completion</Text>
                  <Text style={st.progressPct}>{completionPct}%</Text>
                </View>
                <View style={st.progressTrack}>
                  <View style={[st.progressFill, { width: `${completionPct}%` }]} />
                </View>
              </View>
            )}

            {/* ── Overdue tasks ─────────────────────────────────────── */}
            {overdueTasks.length > 0 && (
              <>
                <Section title="⚠️  Overdue" count={overdueTasks.length} />
                {overdueTasks.map(t => (
                  <Card key={t.id} onPress={() => navigation.navigate('Tasks')} style={st.overdueCard}>
                    <View style={st.taskRow}>
                      <Check done={false} onPress={() => toggleDone(t.id)} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.taskTitle}>{t.title}</Text>
                        <Text style={st.overdueLabel}>
                          Due {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* ── Due today ────────────────────────────────────────── */}
            {todayTasks.length > 0 && (
              <>
                <Section title="Due today" count={todayTasks.length} />
                {todayTasks.map(t => (
                  <Card key={t.id} onPress={() => navigation.navigate('Tasks')}>
                    <View style={st.taskRow}>
                      <Check done={false} onPress={() => toggleDone(t.id)} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.taskTitle}>{t.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                          <View style={[st.dot, { backgroundColor: Colors[`priority${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}`] || Colors.priorityMed }]} />
                          {t.tags.slice(0, 2).map(tag => (
                            <Text key={tag} style={st.tag}>#{tag}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* ── Habit Streaks ─────────────────────────────────────── */}
            {topStreaks.length > 0 && (
              <>
                <Section title="🔥  Streaks" count={topStreaks.length} />
                <View style={st.streaksRow}>
                  {topStreaks.map(h => (
                    <TouchableOpacity
                      key={h.id}
                      style={[st.streakCard, { borderLeftColor: h.color }]}
                      onPress={() => navigation.navigate('Habits')}
                      activeOpacity={0.8}
                    >
                      <Text style={st.streakIcon}>{h.icon}</Text>
                      <Text style={st.streakName} numberOfLines={1}>{h.name}</Text>
                      <Text style={[st.streakNum, { color: h.color }]}>{h.streak}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ── Pinned ───────────────────────────────────────────── */}
            {pinned.length > 0 && (
              <>
                <Section title="📌  Pinned" count={pinned.length} />
                {pinned.map(item => (
                  <Card key={item.id} onPress={() => navigation.navigate(item._t === 'task' ? 'Tasks' : 'Scripts')}>
                    <Text style={st.resultType}>{item._t.toUpperCase()}</Text>
                    <Text style={st.resultTitle}>{item.title}</Text>
                  </Card>
                ))}
              </>
            )}

            {/* ── Recent Activity ──────────────────────────────────── */}
            {recentItems.length > 0 && (
              <>
                <Section title="Recent" count={recentItems.length} />
                {recentItems.map(item => (
                  <Card key={item.id + item._t} onPress={() => {
                    if (item._t === 'task') navigation.navigate('Tasks');
                    else if (item._t === 'script') navigation.navigate('Scripts');
                    else navigation.navigate('Ideas');
                  }}>
                    <View style={st.recentRow}>
                      <View style={[st.recentDot, {
                        backgroundColor: item._t === 'task' ? Colors.accent
                          : item._t === 'script' ? Colors.statusScheduled
                          : Colors.statusDraft,
                      }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.resultTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={st.recentMeta}>{item._t}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Empty fallback */}
            {activeTasks.length === 0 && scripts.length === 0 && ideas.length === 0 && (
              <Empty
                title="Your vault is empty"
                subtitle="Create a task, write a script, or capture an idea to get started."
                action="Create a Task"
                onAction={() => navigation.navigate('Tasks')}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Focus Timer Modal */}
      <FocusTimer visible={focusOpen} onClose={() => setFocusOpen(false)} />

      {/* Quick capture modal */}
      <Modal visible={captureOpen} transparent animationType="slide" onRequestClose={() => setCaptureOpen(false)}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            <Text style={st.modalTitle}>Quick capture</Text>
            <TextInput
              style={st.captureInput}
              value={captureText}
              onChangeText={setCaptureText}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            <View style={st.modalBtns}>
              <TouchableOpacity style={st.btnCancel} onPress={() => { setCaptureOpen(false); setCaptureText(''); }}>
                <Text style={st.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.btnSave, !captureText.trim() && { opacity: 0.4 }]} onPress={handleCapture}>
                <Text style={st.btnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logo: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  captureBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  captureBtnText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  content: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },

  // ── Greeting ──
  greetingWrap: { marginBottom: Spacing.md },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  dateText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  // ── Quote ──
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 10,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  quoteIcon: { fontSize: 18, marginTop: 1 },
  quoteText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },

  // ── Progress ──
  progressWrap: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  progressPct: { fontSize: 11, color: Colors.accent, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },

  // ── Focus Card ──
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accent + '12',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  focusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  focusIcon: { fontSize: 22 },
  focusTitle: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  focusSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  focusArrow: { fontSize: 12, color: Colors.accent },

  // ── Overdue ──
  overdueCard: { borderLeftWidth: 3, borderLeftColor: Colors.priorityHigh },
  overdueLabel: { fontSize: 11, color: Colors.priorityHigh, fontWeight: '600', marginTop: 2 },

  // ── Task row ──
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskTitle: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
  tag: { fontSize: 11, color: Colors.textMuted },

  // ── Streaks ──
  streaksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  streakCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    alignItems: 'center',
    gap: 4,
  },
  streakIcon: { fontSize: 20 },
  streakName: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  streakNum: { fontSize: 16, fontWeight: '800' },

  // ── Recent ──
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Search results
  resultType: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  resultTitle: { fontSize: 14, color: Colors.textPrimary },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.xl,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  captureInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 90,
    marginBottom: Spacing.lg,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  btnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.sm,
    backgroundColor: Colors.card, alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  btnSave: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.sm,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
