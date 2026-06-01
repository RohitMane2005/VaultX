import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Card, Section, Empty, Header, Field } from '../components';
import { useIdeaStore, useTaskStore, useScriptStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

const TABS = ['Active', 'Promoted', 'All'];

export default function IdeasScreen() {
  const [tab, setTab] = useState('Active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { ideas, promoteIdea, deleteIdea } = useIdeaStore();
  const { addTask } = useTaskStore();
  const { addScript } = useScriptStore();

  const filtered = useMemo(() => {
    if (tab === 'Active') return ideas.filter(i => !i.promoted);
    if (tab === 'Promoted') return ideas.filter(i => i.promoted);
    return ideas;
  }, [ideas, tab]);

  const promote = (idea, type) => {
    if (type === 'task') {
      addTask({ title: idea.content, tags: idea.tags || [] });
    } else {
      addScript({ title: idea.content, hook: idea.content, tags: idea.tags || [] });
    }
    promoteIdea(idea.id, type);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDelete = (idea) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete idea?', 'This idea will be removed.', [
      { text: 'Delete', style: 'destructive', onPress: () => deleteIdea(idea.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Header
        title="Ideas"
        right={
          <TouchableOpacity style={st.addBtn} onPress={openAdd}>
            <Text style={st.addBtnText}>+ Capture</Text>
          </TouchableOpacity>
        }
      />

      <View style={st.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[st.tabItem, tab === t && st.tabItemActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); }}
            activeOpacity={0.7}
          >
            <Text style={[st.tabText, tab === t && st.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Empty
            title={tab === 'Promoted' ? 'No promoted ideas' : 'No ideas yet'}
            subtitle={tab === 'Promoted' ? 'Promote an idea to task or script.' : 'Capture ideas fast. Refine later.'}
            action={tab !== 'Promoted' ? 'Capture Idea' : undefined}
            onAction={openAdd}
          />
        ) : (
          <>
            <Section title={tab === 'All' ? 'All ideas' : tab} count={filtered.length} />
            {filtered.map(idea => (
              <Card key={idea.id} onPress={() => { setEditing(idea); setModalOpen(true); }}>
                <View style={st.ideaHeader}>
                  <Text style={[st.ideaText, idea.promoted && st.promoted, { flex: 1 }]} numberOfLines={4}>
                    {idea.content}
                  </Text>
                  <TouchableOpacity
                    onPress={() => confirmDelete(idea)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingLeft: 8 }}
                  >
                    <Text style={st.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={st.ideaBottom}>
                  <Text style={st.ideaTime}>
                    {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                  </Text>
                  {idea.promoted && (
                    <Text style={st.promotedLabel}>→ {idea.promotedTo}</Text>
                  )}
                  {idea.tags?.slice(0, 2).map(t => <Text key={t} style={st.ideaTag}>#{t}</Text>)}
                </View>
                {!idea.promoted && (
                  <View style={st.promoteRow}>
                    <TouchableOpacity style={st.promoteBtn} onPress={() => promote(idea, 'task')}>
                      <Text style={st.promoteBtnText}>→ Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.promoteBtn} onPress={() => promote(idea, 'script')}>
                      <Text style={st.promoteBtnText}>→ Script</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <IdeaModal
        visible={modalOpen}
        idea={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onDelete={(id) => { deleteIdea(id); setModalOpen(false); setEditing(null); }}
      />
    </SafeAreaView>
  );
}

function IdeaModal({ visible, idea, onClose, onDelete }) {
  const { addIdea, updateIdea } = useIdeaStore();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  React.useEffect(() => {
    if (visible) {
      setContent(idea?.content ?? '');
      setTags(idea?.tags?.join(', ') ?? '');
    }
  }, [visible, idea]);

  const save = () => {
    if (!content.trim()) return;
    const tagList = tags.split(',').map(s => s.trim()).filter(Boolean);
    if (idea) updateIdea(idea.id, { content: content.trim(), tags: tagList });
    else addIdea({ content: content.trim(), tags: tagList });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete idea?', 'This idea will be permanently removed.', [
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(idea.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalBg}>
        <View style={st.modal}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>{idea ? 'Edit idea' : 'Capture idea'}</Text>
            {idea && (
              <TouchableOpacity onPress={handleDelete}>
                <Text style={st.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={st.ideaInput}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
            textAlignVertical="top"
          />
          <Field label="Tags (optional)" value={tags} onChangeText={setTags} placeholder="content, dev, reel..." />
          <View style={st.modalBtns}>
            <TouchableOpacity style={st.btnCancel} onPress={onClose}>
              <Text style={st.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.btnSave, !content.trim() && { opacity: 0.4 }]} onPress={save}>
              <Text style={st.btnSaveText}>{idea ? 'Update' : 'Save'}</Text>
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

  ideaHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  ideaText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21, marginBottom: 6 },
  promoted: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  deleteIcon: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  ideaBottom: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  ideaTime: { fontSize: 11, color: Colors.textMuted },
  promotedLabel: { fontSize: 11, color: Colors.statusReady, fontWeight: '500' },
  ideaTag: { fontSize: 11, color: Colors.textMuted },
  promoteRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  promoteBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  promoteBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: Spacing.xl, paddingBottom: 32 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalDeleteText: { fontSize: 13, fontWeight: '600', color: Colors.priorityHigh },
  ideaInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  btnCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.card, alignItems: 'center' },
  btnCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  btnSave: { flex: 2, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.accent, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
