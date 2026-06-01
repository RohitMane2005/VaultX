import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Switch, Alert, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, PRIORITIES } from '../constants/theme';
import { Card, Section, Empty, Header, Field, Check } from '../components';
import { useTaskStore } from '../store';
import { isToday, isTomorrow, isPast, format } from 'date-fns';

const TABS = ['All', 'Today', 'Upcoming', 'Done'];

function dueLabel(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date)) return 'Overdue';
  return format(date, 'dd MMM');
}

function dueColor(d, done) {
  if (!d || done) return Colors.textMuted;
  const date = new Date(d);
  if (isPast(date) && !isToday(date)) return Colors.priorityHigh;
  if (isToday(date)) return Colors.priorityMed;
  return Colors.textMuted;
}

export default function TasksScreen() {
  const [tab, setTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { tasks, toggleDone, deleteTask, togglePin, clearDone, addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();

  const doneCount = useMemo(() => tasks.filter(t => t.done).length, [tasks]);

  const filtered = useMemo(() => {
    switch (tab) {
      case 'Today':
        return tasks.filter(t => !t.done && t.dueDate && isToday(new Date(t.dueDate)));
      case 'Upcoming':
        return tasks.filter(t => !t.done);
      case 'Done':
        return tasks.filter(t => t.done);
      default:
        return tasks.filter(t => !t.done);
    }
  }, [tasks, tab]);

  const groups = useMemo(() => {
    if (tab === 'Done') return null;
    return {
      high:   filtered.filter(t => t.priority === 'high'),
      medium: filtered.filter(t => t.priority === 'medium'),
      low:    filtered.filter(t => t.priority === 'low'),
    };
  }, [filtered, tab]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (task) => { setEditing(task); setModalOpen(true); };

  const confirmDelete = (task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete task?', `"${task.title}" will be removed.`, [
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleClearDone = () => {
    Alert.alert('Clear completed?', `${doneCount} completed tasks will be removed.`, [
      { text: 'Clear all', style: 'destructive', onPress: clearDone },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderTask = (t) => (
    <Card key={t.id} onPress={() => openEdit(t)}>
      <View style={st.taskRow}>
        <Check done={t.done} onPress={() => toggleDone(t.id)} />
        <View style={{ flex: 1 }}>
          <Text style={[st.taskTitle, t.done && st.taskDone]} numberOfLines={2}>{t.title}</Text>
          {t.description ? <Text style={st.taskDesc} numberOfLines={1}>{t.description}</Text> : null}
          <View style={st.taskMeta}>
            <View style={[st.prioDot, { backgroundColor: Colors[`priority${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}`] }]} />
            {t.dueDate && (
              <Text style={[st.metaItem, { color: dueColor(t.dueDate, t.done) }]}>
                {dueLabel(t.dueDate)}
              </Text>
            )}
            {t.tags.slice(0, 2).map(tag => <Text key={tag} style={st.metaItem}>#{tag}</Text>)}
            {t.pinned && <Text style={[st.metaItem, { color: Colors.textSecondary }]}>pinned</Text>}
          </View>
          {/* Subtask progress */}
          {t.subtasks && t.subtasks.length > 0 && (
            <View style={st.subtaskProgress}>
              <View style={st.subtaskTrack}>
                <View style={[st.subtaskFill, { width: `${(t.subtasks.filter(s => s.done).length / t.subtasks.length) * 100}%` }]} />
              </View>
              <Text style={st.subtaskCount}>{t.subtasks.filter(s => s.done).length}/{t.subtasks.length}</Text>
            </View>
          )}
        </View>
        {/* Action buttons */}
        <View style={st.cardActions}>
          <TouchableOpacity
            style={st.actionIcon}
            onPress={() => togglePin(t.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[st.actionIconText, t.pinned && { color: Colors.accent }]}>
              {t.pinned ? '📌' : '📍'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.actionIcon}
            onPress={() => confirmDelete(t)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={st.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderGroup = (label, color, items) => {
    if (!items.length) return null;
    return (
      <React.Fragment key={label}>
        <View style={st.groupHeader}>
          <View style={[st.groupDot, { backgroundColor: color }]} />
          <Text style={st.groupLabel}>{label}</Text>
          <Text style={st.groupCount}>{items.length}</Text>
        </View>
        {items.map(renderTask)}
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Header
        title="Tasks"
        right={
          <TouchableOpacity style={st.addBtn} onPress={openAdd}>
            <Text style={st.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Segmented tab bar */}
      <View style={st.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[st.tabItem, tab === t && st.tabItemActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); }}
            activeOpacity={0.7}
          >
            <Text style={[st.tabText, tab === t && st.tabTextActive]}>
              {t}{t === 'Done' && doneCount > 0 ? ` (${doneCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Empty
            title={tab === 'Done' ? 'Nothing completed yet' : 'No tasks'}
            subtitle={tab === 'Today' ? "Nothing due today." : "Tap + Add to create one."}
            action={tab !== 'Done' ? 'Add Task' : undefined}
            onAction={openAdd}
          />
        ) : tab === 'Done' ? (
          <>
            {/* Clear completed button */}
            <View style={st.clearRow}>
              <Section title="Completed" count={doneCount} />
              <TouchableOpacity style={st.clearBtn} onPress={handleClearDone}>
                <Text style={st.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {filtered.map(renderTask)}
          </>
        ) : (
          <>
            {renderGroup('High', Colors.priorityHigh, groups.high)}
            {renderGroup('Medium', Colors.priorityMed, groups.medium)}
            {renderGroup('Low', Colors.priorityLow, groups.low)}
          </>
        )}
      </ScrollView>

      <TaskModal
        visible={modalOpen}
        task={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onDelete={(id) => { deleteTask(id); setModalOpen(false); setEditing(null); }}
      />
    </SafeAreaView>
  );
}

/* ── Add / Edit Modal ────────────────────────────────────────────────────── */
function TaskModal({ visible, task, onClose, onDelete }) {
  const { addTask, updateTask, addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pinned, setPinned] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  React.useEffect(() => {
    if (visible) {
      setTitle(task?.title ?? '');
      setDesc(task?.description ?? '');
      setPriority(task?.priority ?? 'medium');
      setTags(task?.tags?.join(', ') ?? '');
      setDueDate(task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
      setPinned(task?.pinned ?? false);
    }
  }, [visible, task]);

  const save = () => {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: desc,
      priority,
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      pinned,
    };
    if (task) updateTask(task.id, data);
    else addTask(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete task?', `"${task.title}" will be permanently removed.`, [
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalBg}>
        <ScrollView bounces={false} style={{ maxHeight: '85%' }}>
          <View style={st.modal}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>{task ? 'Edit task' : 'New task'}</Text>
              {task && (
                <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={st.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>

            <Field label="Title" value={title} onChangeText={setTitle} placeholder="What needs to be done?" autoFocus />
            <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Details (optional)" multiline inputStyle={{ minHeight: 50, textAlignVertical: 'top' }} />

            <Text style={st.label}>Priority</Text>
            <View style={st.priorityRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[st.prioChip, priority === p.key && { borderColor: p.color, backgroundColor: p.color + '15' }]}
                  onPress={() => setPriority(p.key)}
                >
                  <View style={[st.prioChipDot, { backgroundColor: p.color }]} />
                  <Text style={[st.prioChipText, priority === p.key && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.label}>Due date</Text>
            <View style={st.dateQuickRow}>
              {[
                { label: 'Today', fn: () => { const d = new Date(); setDueDate(d.toISOString().slice(0, 10)); }},
                { label: 'Tomorrow', fn: () => { const d = new Date(); d.setDate(d.getDate() + 1); setDueDate(d.toISOString().slice(0, 10)); }},
                { label: '+3d', fn: () => { const d = new Date(); d.setDate(d.getDate() + 3); setDueDate(d.toISOString().slice(0, 10)); }},
                { label: '+7d', fn: () => { const d = new Date(); d.setDate(d.getDate() + 7); setDueDate(d.toISOString().slice(0, 10)); }},
                { label: 'Clear', fn: () => setDueDate('') },
              ].map(b => (
                <TouchableOpacity key={b.label} style={[st.dateChip, dueDate && b.label !== 'Clear' && { opacity: 0.6 }]} onPress={() => { Haptics.selectionAsync(); b.fn(); }}>
                  <Text style={[st.dateChipText, b.label === 'Clear' && { color: Colors.priorityHigh }]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Field value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD (or tap above)" />
            <Field label="Tags" value={tags} onChangeText={setTags} placeholder="dev, college, content..." />

            <View style={st.switchRow}>
              <Text style={{ fontSize: 14, color: Colors.textPrimary }}>Pin to home</Text>
              <Switch value={pinned} onValueChange={setPinned} trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor="#fff" />
            </View>

            {/* Subtasks (edit mode only) */}
            {task && (
              <View style={st.subtaskSection}>
                <Text style={st.label}>Subtasks {task.subtasks?.length > 0 ? `(${task.subtasks.filter(s => s.done).length}/${task.subtasks.length})` : ''}</Text>
                {(task.subtasks || []).map(sub => (
                  <View key={sub.id} style={st.subtaskRow}>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleSubtask(task.id, sub.id); }} style={[st.subtaskCheck, sub.done && st.subtaskCheckDone]}>
                      {sub.done && <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={[st.subtaskText, sub.done && { textDecorationLine: 'line-through', color: Colors.textMuted }]} numberOfLines={1}>{sub.title}</Text>
                    <TouchableOpacity onPress={() => deleteSubtask(task.id, sub.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 11, color: Colors.textMuted }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={st.addSubtaskRow}>
                  <TextInput
                    style={st.addSubtaskInput}
                    value={newSubtask}
                    onChangeText={setNewSubtask}
                    placeholder="Add a subtask..."
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={() => {
                      if (newSubtask.trim()) {
                        addSubtask(task.id, newSubtask.trim());
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewSubtask('');
                      }
                    }}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[st.addSubtaskBtn, !newSubtask.trim() && { opacity: 0.3 }]}
                    onPress={() => {
                      if (newSubtask.trim()) {
                        addSubtask(task.id, newSubtask.trim());
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setNewSubtask('');
                      }
                    }}
                  >
                    <Text style={st.addSubtaskBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={st.modalBtns}>
              <TouchableOpacity style={st.btnCancel} onPress={onClose}>
                <Text style={st.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.btnSave, !title.trim() && { opacity: 0.4 }]} onPress={save}>
                <Text style={st.btnSaveText}>{task ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // ── Segmented tab bar ──
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },

  content: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },

  // ── Clear completed ──
  clearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.priorityHigh,
  },

  // ── Priority group header ──
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  groupCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 2,
  },

  // ── Task card ──
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, lineHeight: 20 },
  taskDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  metaItem: { fontSize: 11, color: Colors.textMuted },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: { fontSize: 14 },
  deleteIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // ── Modal ──
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.xl,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalDeleteText: { fontSize: 13, fontWeight: '600', color: Colors.priorityHigh },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  priorityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  prioChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  prioChipDot: { width: 7, height: 7, borderRadius: 4 },
  prioChipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
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
  dateQuickRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  dateChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  dateChipText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  // Subtask progress on card
  subtaskProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subtaskTrack: { flex: 1, height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  subtaskFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  subtaskCount: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  // Subtask management in modal
  subtaskSection: { marginBottom: Spacing.lg },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  subtaskCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  subtaskCheckDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  subtaskText: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  addSubtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addSubtaskInput: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: Colors.textPrimary },
  addSubtaskBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  addSubtaskBtnText: { fontSize: 18, color: '#fff', fontWeight: '600', marginTop: -1 },
});
