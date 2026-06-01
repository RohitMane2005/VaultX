# VaultX — Personal Productivity App

> by @who.xsor | Built with React Native + Expo + Zustand

A dark-themed, offline-first mobile productivity app to manage tasks,
notes, social media scripts, code snippets, ideas, and habits — all in one place.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React Native (Expo) | One codebase → Android + iOS |
| State | Zustand + persist | Lightweight, no boilerplate |
| Storage | AsyncStorage | Offline-first, no internet needed |
| Navigation | React Navigation v6 | Bottom tabs + stack |
| Cloud (optional) | Supabase | You already know it from PathShashtra |

---

## Project Structure

```
vaultx/
├── App.js                        # Entry point
├── app.json                      # Expo config
├── package.json
└── src/
    ├── constants/
    │   └── theme.js              # Colors, spacing, typography
    ├── store/
    │   └── index.js              # Zustand stores (Tasks, Notes, Scripts, Habits, Ideas, Snippets)
    ├── components/
    │   └── index.js              # Shared UI components (Card, Badge, FAB, etc.)
    ├── screens/
    │   ├── HomeScreen.js         # Dashboard with search, pinned, quick access
    │   ├── TasksScreen.js        # To-do with priority, tags, due dates
    │   ├── ScriptsScreen.js      # Hook/Body/CTA script editor, platform filter
    │   └── HabitsScreen.js       # Weekly dot tracker with streaks
    └── navigation/
        └── index.js              # Bottom tab + stack nav
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start

# 3. Run on Android (with device/emulator connected)
npx expo start --android

# 4. Run on iOS (macOS only)
npx expo start --ios
```

---

## Feature Modules

### ✅ Tasks
- Priority levels: High / Medium / Low
- Due dates, tags, done/undone toggle
- Grouped by priority, filtered by Today / Upcoming / All / Done
- Long press for edit/delete

### 🎬 Scripts
- Structured editor: Hook → Body → CTA
- Platform filter: Instagram / YouTube / LinkedIn / Twitter X
- Status workflow: Draft → Ready → Scheduled → Posted
- Copy full script to clipboard in one tap

### 🔥 Habits
- Weekly dot view (Mon–Sun)
- Streak counter per habit
- Tap today's dot to mark done
- Long press to delete

### 🏠 Home
- Global search across all content types
- Quick access tiles with live counts
- Pinned items from any category
- Quick capture for ideas

---

## Adding Notes Screen (Next Step)

```js
// src/screens/NotesScreen.js — key logic:
import { useNoteStore } from '../store';
const { notes, addNote, updateNote, deleteNote } = useNoteStore();

// Note structure:
// { id, title, content, tags[], pinned, locked, createdAt, updatedAt }

// For rich editing — install:
// npm install react-native-markdown-display
```

## Adding Code Snippets Screen (Next Step)

```js
// src/screens/SnippetsScreen.js — key logic:
import { useSnippetStore } from '../store';

// Snippet structure:
// { id, title, code, language, description, tags[], pinned }

// For syntax highlighting — install:
// npm install react-native-code-highlight
// or: npm install react-native-syntax-highlighter
```

## Adding Supabase Sync (Optional)

```js
// src/utils/sync.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Sync tasks to Supabase
export async function syncTasks(tasks) {
  const { error } = await supabase
    .from('tasks')
    .upsert(tasks, { onConflict: 'id' });
  if (error) console.error('Sync error:', error);
}
```

---

## Roadmap

- [ ] Notes screen (markdown editor)
- [ ] Code snippets screen (syntax highlight)
- [ ] Ideas inbox
- [ ] Hashtag sets manager
- [ ] Content calendar view
- [ ] Private vault (PIN lock)
- [ ] Supabase cloud sync
- [ ] AI Assist (Groq API — expand idea into full script)
- [ ] Export to PDF / share sheet
- [ ] Widget support (Expo WidgetKit)
