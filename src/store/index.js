import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// ─── TASKS STORE ─────────────────────────────────────────────────────────────
export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (data) => {
        const task = {
          id: uuidv4(),
          title: '',
          description: '',
          priority: 'medium',
          tags: [],
          subtasks: [],
          dueDate: null,
          done: false,
          pinned: false,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, data) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      toggleDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      clearDone: () =>
        set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),

      togglePin: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, pinned: !t.pinned } : t
          ),
        })),

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), { id: uuidv4(), title, done: false }] }
              : t
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: (t.subtasks || []).map((st) => st.id === subtaskId ? { ...st, done: !st.done } : st) }
              : t
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId) }
              : t
          ),
        })),

      getTodayTasks: () => {
        const today = new Date().toDateString();
        return get().tasks.filter(
          (t) =>
            !t.done &&
            t.dueDate &&
            new Date(t.dueDate).toDateString() === today
        );
      },
    }),
    { name: 'vaultora-tasks', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── NOTES STORE ─────────────────────────────────────────────────────────────
export const useNoteStore = create(
  persist(
    (set) => ({
      notes: [],

      addNote: (data) => {
        const note = {
          id: uuidv4(),
          title: '',
          content: '',
          tags: [],
          pinned: false,
          locked: false,   // private vault feature
          color: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },

      updateNote: (id, data) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...data, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      togglePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'vaultora-notes', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── SCRIPTS STORE ───────────────────────────────────────────────────────────
export const useScriptStore = create(
  persist(
    (set) => ({
      scripts: [],

      addScript: (data) => {
        const script = {
          id: uuidv4(),
          title: '',
          platform: 'Instagram',    // 'Instagram' | 'YouTube' | 'LinkedIn' | 'Twitter/X'
          status: 'draft',          // 'draft' | 'ready' | 'scheduled' | 'posted'
          hook: '',
          body: '',
          cta: '',
          hashtags: [],
          duration: null,           // reel length in seconds
          scheduledAt: null,
          tags: [],
          pinned: false,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ scripts: [script, ...s.scripts] }));
        return script;
      },

      updateScript: (id, data) =>
        set((s) => ({
          scripts: s.scripts.map((sc) =>
            sc.id === id ? { ...sc, ...data } : sc
          ),
        })),

      togglePin: (id) =>
        set((s) => ({
          scripts: s.scripts.map((sc) =>
            sc.id === id ? { ...sc, pinned: !sc.pinned } : sc
          ),
        })),

      deleteScript: (id) =>
        set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id) })),
    }),
    { name: 'vaultora-scripts', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── SNIPPETS STORE ──────────────────────────────────────────────────────────
export const useSnippetStore = create(
  persist(
    (set) => ({
      snippets: [],

      addSnippet: (data) => {
        const snippet = {
          id: uuidv4(),
          title: '',
          code: '',
          language: 'java',
          description: '',
          tags: [],
          pinned: false,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ snippets: [snippet, ...s.snippets] }));
        return snippet;
      },

      updateSnippet: (id, data) =>
        set((s) => ({
          snippets: s.snippets.map((sn) =>
            sn.id === id ? { ...sn, ...data } : sn
          ),
        })),

      deleteSnippet: (id) =>
        set((s) => ({ snippets: s.snippets.filter((sn) => sn.id !== id) })),
    }),
    { name: 'vaultora-snippets', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── HABITS STORE ────────────────────────────────────────────────────────────
export const useHabitStore = create(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (data) => {
        const habit = {
          id: uuidv4(),
          name: '',
          icon: '🔥',
          color: '#e03c3c',
          completedDates: [],   // array of ISO date strings
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ habits: [habit, ...s.habits] }));
        return habit;
      },

      toggleToday: (id) => {
        const today = new Date().toDateString();
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const alreadyDone = h.completedDates.some(
              (d) => new Date(d).toDateString() === today
            );
            return {
              ...h,
              completedDates: alreadyDone
                ? h.completedDates.filter(
                    (d) => new Date(d).toDateString() !== today
                  )
                : [...h.completedDates, new Date().toISOString()],
            };
          }),
        }));
      },

      getStreak: (habitId) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          if (habit.completedDates.some((d) => new Date(d).toDateString() === dateStr)) {
            streak++;
          } else if (i > 0) break;
        }
        return streak;
      },

      getBestStreak: (habitId) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit || habit.completedDates.length === 0) return 0;

        const sorted = [...habit.completedDates]
          .map(d => new Date(d))
          .sort((a, b) => a - b);

        let best = 1, current = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = Math.round((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            current++;
            if (current > best) best = current;
          } else if (diff > 1) {
            current = 1;
          }
        }
        return best;
      },

      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
    }),
    { name: 'vaultora-habits', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── IDEAS STORE ─────────────────────────────────────────────────────────────
export const useIdeaStore = create(
  persist(
    (set) => ({
      ideas: [],

      addIdea: (data) => {
        const idea = {
          id: uuidv4(),
          content: '',
          tags: [],
          promoted: false,   // promoted to task/note/script
          promotedTo: null,  // 'task' | 'note' | 'script'
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ ideas: [idea, ...s.ideas] }));
        return idea;
      },

      updateIdea: (id, data) =>
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      promoteIdea: (id, type) =>
        set((s) => ({
          ideas: s.ideas.map((i) =>
            i.id === id ? { ...i, promoted: true, promotedTo: type } : i
          ),
        })),

      deleteIdea: (id) =>
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
    }),
    { name: 'vaultora-ideas', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── HASHTAG SETS STORE ──────────────────────────────────────────────────────
export const useHashtagStore = create(
  persist(
    (set) => ({
      sets: [],

      addSet: (name, tags) => {
        const set_ = { id: uuidv4(), name, tags, createdAt: new Date().toISOString() };
        set((s) => ({ sets: [set_, ...s.sets] }));
        return set_;
      },

      deleteSet: (id) =>
        set((s) => ({ sets: s.sets.filter((hs) => hs.id !== id) })),
    }),
    { name: 'vaultora-hashtags', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── FOCUS STORE ─────────────────────────────────────────────────────────────
export const useFocusStore = create(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (data) => {
        const session = {
          id: uuidv4(),
          duration: 25,
          type: 'work',
          completedAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
      },

      getTodaySessions: () => {
        const today = new Date().toDateString();
        return get().sessions.filter((s) => new Date(s.completedAt).toDateString() === today);
      },

      getTodayWorkMinutes: () => {
        const today = new Date().toDateString();
        return get().sessions
          .filter((s) => new Date(s.completedAt).toDateString() === today && s.type === 'work')
          .reduce((sum, s) => sum + s.duration, 0);
      },

      getWeekSessions: () => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return get().sessions.filter((s) => new Date(s.completedAt) >= weekAgo);
      },
    }),
    { name: 'vaultora-focus', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ─── BACKUP / RESTORE UTILITIES ──────────────────────────────────────────────
export async function exportAllData() {
  const keys = ['vaultora-tasks', 'vaultora-notes', 'vaultora-scripts', 'vaultora-snippets', 'vaultora-habits', 'vaultora-ideas', 'vaultora-hashtags', 'vaultora-focus'];
  const data = {};
  for (const key of keys) {
    const val = await AsyncStorage.getItem(key);
    if (val) data[key] = JSON.parse(val);
  }
  data._exportedAt = new Date().toISOString();
  data._version = '1.0';
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString) {
  const data = JSON.parse(jsonString);
  const keys = ['vaultora-tasks', 'vaultora-notes', 'vaultora-scripts', 'vaultora-snippets', 'vaultora-habits', 'vaultora-ideas', 'vaultora-hashtags', 'vaultora-focus'];
  for (const key of keys) {
    if (data[key]) {
      await AsyncStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}

export async function clearAllData() {
  const keys = ['vaultora-tasks', 'vaultora-notes', 'vaultora-scripts', 'vaultora-snippets', 'vaultora-habits', 'vaultora-ideas', 'vaultora-hashtags', 'vaultora-focus'];
  await AsyncStorage.multiRemove(keys);
}
