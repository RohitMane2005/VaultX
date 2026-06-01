// src/components/index.js — Shared UI primitives

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius } from '../constants/theme';



// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress, onLongPress }) {
  const Wrapper = onPress || onLongPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[s.card, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {children}
    </Wrapper>
  );
}

// ── Section title ────────────────────────────────────────────────────────────
export function Section({ title, count, style }) {
  return (
    <View style={[s.section, style]}>
      <Text style={s.sectionText}>{title}</Text>
      {count !== undefined && <Text style={s.sectionCount}>{count}</Text>}
    </View>
  );
}

// ── Search bar ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={s.searchWrap}>
      <TextInput
        style={s.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={Colors.textMuted}
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Text style={s.searchClear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Text input field ─────────────────────────────────────────────────────────
export function Field({ label, style, inputStyle, ...props }) {
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && <Text style={s.fieldLabel}>{label}</Text>}
      <TextInput
        style={[s.fieldInput, inputStyle]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
    </View>
  );
}

// ── Check circle ─────────────────────────────────────────────────────────────
export function Check({ done, onPress }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  return (
    <TouchableOpacity
      style={[s.check, done && s.checkDone]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {done && <Text style={s.checkMark}>✓</Text>}
    </TouchableOpacity>
  );
}

// ── Small pill/tag ───────────────────────────────────────────────────────────
export function Pill({ label, color, active, onPress, style }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[
        s.pill,
        color && { borderColor: color },
        active && { backgroundColor: Colors.accent, borderColor: Colors.accent },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[s.pillText, active && { color: '#fff' }]}>{label}</Text>
    </Wrapper>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ title, subtitle, action, onAction }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle && <Text style={s.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={s.emptyBtn} onPress={onAction}>
          <Text style={s.emptyBtnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Header bar ───────────────────────────────────────────────────────────────
export function Header({ title, right }) {
  return (
    <View style={s.header}>
      <Text style={s.headerTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchClear: { color: Colors.textMuted, fontSize: 14, paddingLeft: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  pillText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: Spacing.lg },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
});
