import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, PLATFORMS } from '../constants/theme';
import { Card, Section, Empty, Header, Field } from '../components';
import { useScriptStore } from '../store';

const STATUSES = ['draft', 'ready', 'scheduled', 'posted'];
const STATUS_COLORS = {
  draft: Colors.statusDraft,
  ready: Colors.statusReady,
  scheduled: Colors.statusScheduled,
  posted: Colors.statusPosted,
};

export default function ScriptsScreen() {
  const [platform, setPlatform] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { scripts, deleteScript, togglePin } = useScriptStore();

  const filtered = useMemo(() => {
    if (platform === 'All') return scripts;
    return scripts.filter(s => s.platform === platform);
  }, [scripts, platform]);

  const byStatus = useMemo(() => ({
    ready:     filtered.filter(s => s.status === 'ready'),
    draft:     filtered.filter(s => s.status === 'draft'),
    scheduled: filtered.filter(s => s.status === 'scheduled'),
    posted:    filtered.filter(s => s.status === 'posted'),
  }), [filtered]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setModalOpen(true); };

  const confirmDelete = (script) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete script?', `"${script.title || 'Untitled'}" will be removed.`, [
      { text: 'Delete', style: 'destructive', onPress: () => deleteScript(script.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderScript = (s) => (
    <Card key={s.id} onPress={() => openEdit(s)}>
      <View style={st.cardTop}>
        <View style={st.statusRow}>
          <View style={[st.statusDot, { backgroundColor: STATUS_COLORS[s.status] }]} />
          <Text style={[st.statusText, { color: STATUS_COLORS[s.status] }]}>
            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
          </Text>
        </View>
        <View style={st.cardActions}>
          <Text style={st.platformLabel}>{s.platform}</Text>
          <TouchableOpacity
            onPress={() => togglePin(s.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 13 }}>{s.pinned ? '📌' : '📍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDelete(s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={st.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={st.scriptTitle} numberOfLines={2}>{s.title || '(Untitled)'}</Text>
      {s.hook ? (
        <View style={st.hookBox}>
          <Text style={st.hookText} numberOfLines={2}>{s.hook}</Text>
        </View>
      ) : null}
      <View style={st.scriptMeta}>
        {s.duration ? <Text style={st.metaText}>{s.duration}s</Text> : null}
        {s.hashtags.slice(0, 3).map(h => <Text key={h} style={st.metaText}>#{h}</Text>)}
      </View>
    </Card>
  );

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <React.Fragment key={label}>
        <Section title={label} count={items.length} />
        {items.map(renderScript)}
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Header
        title="Scripts"
        right={
          <TouchableOpacity style={st.addBtn} onPress={openAdd}>
            <Text style={st.addBtnText}>+ New</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
        <View style={st.tabBar}>
          {['All', ...PLATFORMS].map(p => (
            <TouchableOpacity
              key={p}
              style={[st.tabItem, platform === p && st.tabItemActive]}
              onPress={() => { Haptics.selectionAsync(); setPlatform(p); }}
              activeOpacity={0.7}
            >
              <Text style={[st.tabText, platform === p && st.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Empty title="No scripts" subtitle="Write your first script — hook, body, CTA." action="Write Script" onAction={openAdd} />
        ) : (
          <>
            {renderGroup('Ready', byStatus.ready)}
            {renderGroup('Drafts', byStatus.draft)}
            {renderGroup('Scheduled', byStatus.scheduled)}
            {renderGroup('Posted', byStatus.posted)}
          </>
        )}
      </ScrollView>

      <ScriptModal
        visible={modalOpen}
        script={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onDelete={(id) => { deleteScript(id); setModalOpen(false); setEditing(null); }}
      />
    </SafeAreaView>
  );
}

/* ── Script Editor Modal ─────────────────────────────────────────────────── */
function ScriptModal({ visible, script, onClose, onDelete }) {
  const { addScript, updateScript } = useScriptStore();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [status, setStatus] = useState('draft');
  const [hook, setHook] = useState('');
  const [body, setBody] = useState('');
  const [cta, setCta] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [duration, setDuration] = useState('');
  const [section, setSection] = useState('hook');

  React.useEffect(() => {
    if (visible) {
      setTitle(script?.title ?? '');
      setPlatform(script?.platform ?? 'Instagram');
      setStatus(script?.status ?? 'draft');
      setHook(script?.hook ?? '');
      setBody(script?.body ?? '');
      setCta(script?.cta ?? '');
      setHashtags(script?.hashtags?.join(' ') ?? '');
      setDuration(script?.duration?.toString() ?? '');
      setSection('hook');
    }
  }, [visible, script]);

  const save = () => {
    const tags = hashtags.replace(/#/g, '').split(/[\s,]+/).filter(Boolean);
    const data = {
      title: title.trim() || 'Untitled Script',
      platform, status, hook, body, cta,
      hashtags: tags,
      duration: duration ? parseInt(duration) : null,
    };
    if (script) updateScript(script.id, data);
    else addScript(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const copyAll = async () => {
    const full = [hook, body, cta].filter(Boolean).join('\n\n');
    await Clipboard.setStringAsync(full);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Script copied to clipboard.');
  };

  const handleDelete = () => {
    Alert.alert('Delete script?', `"${script?.title || 'Untitled'}" will be permanently removed.`, [
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(script.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const SECTIONS = { hook, body, cta };
  const PLACEHOLDERS = {
    hook: 'The first 3 seconds — what stops the scroll?',
    body: 'Main content, story, explanation...',
    cta: 'Follow, comment, share, link in bio...',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalBg}>
        <ScrollView bounces={false} style={{ maxHeight: '92%' }}>
          <View style={st.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={st.modalTitle}>{script ? 'Edit script' : 'New script'}</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {script && (
                  <TouchableOpacity onPress={handleDelete}>
                    <Text style={{ fontSize: 13, color: Colors.priorityHigh, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={copyAll}>
                  <Text style={{ fontSize: 13, color: Colors.accent, fontWeight: '600' }}>Copy all</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Field value={title} onChangeText={setTitle} placeholder="Script title..." />

            {/* Platform */}
            <Text style={st.label}>Platform</Text>
            <View style={[st.modalTabBar, { marginBottom: Spacing.md }]}>
              {PLATFORMS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[st.modalTab, platform === p && st.modalTabActive]}
                  onPress={() => setPlatform(p)}
                >
                  <Text style={[st.modalTabText, platform === p && { color: '#fff' }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={st.label}>Status</Text>
            <View style={[st.modalTabBar, { marginBottom: Spacing.lg }]}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[st.modalTab, status === s && st.modalTabActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[st.modalTabText, status === s && { color: '#fff' }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section tabs */}
            <View style={st.sectionTabs}>
              {['hook', 'body', 'cta'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[st.sectionTab, section === s && st.sectionTabActive]}
                  onPress={() => setSection(s)}
                >
                  <Text style={[st.sectionTabText, section === s && { color: Colors.accent }]}>
                    {s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={st.scriptInput}
              value={SECTIONS[section]}
              onChangeText={v => {
                if (section === 'hook') setHook(v);
                else if (section === 'body') setBody(v);
                else setCta(v);
              }}
              placeholder={PLACEHOLDERS[section]}
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <Field style={{ flex: 1, marginBottom: 0 }} value={duration} onChangeText={setDuration} placeholder="Duration (s)" keyboardType="numeric" />
              <Field style={{ flex: 2, marginBottom: 0 }} value={hashtags} onChangeText={setHashtags} placeholder="#java #xsor" />
            </View>

            <View style={st.modalBtns}>
              <TouchableOpacity style={st.btnCancel} onPress={onClose}>
                <Text style={st.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.btnSave} onPress={save}>
                <Text style={st.btnSaveText}>{script ? 'Update' : 'Save'}</Text>
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
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.sm },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  filterRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 3,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  content: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },

  // Card
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  platformLabel: { fontSize: 11, color: Colors.textMuted },
  scriptTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 4 },
  deleteIcon: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  hookBox: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    padding: Spacing.sm,
    marginBottom: 6,
  },
  hookText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  scriptMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: Colors.textMuted },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: Spacing.xl, paddingBottom: 32 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  modalTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 3,
    flexWrap: 'wrap',
    gap: 2,
  },
  modalTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalTabActive: {
    backgroundColor: Colors.accent,
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sectionTabs: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md },
  sectionTab: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm,
    backgroundColor: Colors.card, alignItems: 'center',
  },
  sectionTabActive: { backgroundColor: Colors.accentDim },
  sectionTabText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  scriptInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  btnCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.card, alignItems: 'center' },
  btnCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  btnSave: { flex: 2, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.accent, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
