// src/constants/theme.js — Vaultora Design Tokens

export const Colors = {
  bg:          '#0d0d0d',
  surface:     '#141414',
  card:        '#1a1a1a',
  border:      '#262626',

  accent:      '#e03c3c',
  accentDim:   'rgba(224,60,60,0.1)',

  textPrimary:   '#ddd',
  textSecondary: '#888',
  textMuted:     '#555',

  priorityHigh:  '#e03c3c',
  priorityMed:   '#e6a817',
  priorityLow:   '#2faa4f',

  statusDraft:     '#e6a817',
  statusReady:     '#2faa4f',
  statusScheduled: '#5b8af5',
  statusPosted:    '#888',
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const Radius  = { sm: 8, md: 10, lg: 14, full: 999 };

export const PLATFORMS  = ['Instagram', 'YouTube', 'LinkedIn', 'Twitter/X'];
export const PRIORITIES = [
  { key: 'high',   label: 'High',   color: Colors.priorityHigh },
  { key: 'medium', label: 'Medium', color: Colors.priorityMed },
  { key: 'low',    label: 'Low',    color: Colors.priorityLow },
];
