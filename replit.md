# NoteVault

An all-in-one productivity app combining Memos, Tasks, Ledger, and Calculator.

## Features

- **Memos** - Rich text notes with title, content, tags (personal/work/ideas/important), pin, search
- **Tasks** - Task manager with priority levels (high/medium/low), completion toggle, notes
- **Ledger** - Expenditure tracker with income/expense entries, categories, auto-calculated balance
- **Calculator** - Full calculator with "Add to Ledger" integration

## Architecture

- Expo Router (file-based routing) with 4 tabs
- All data stored locally with AsyncStorage (no internet required)
- Context API (`context/AppContext.tsx`) manages all state
- Dark/light theme support via `constants/colors.ts`

## Stack

- Expo SDK 54 + React Native
- Expo Router with NativeTabs (liquid glass iOS 26+)
- AsyncStorage for persistence
- @expo/vector-icons for all icons
- react-native-safe-area-context for inset handling
- expo-haptics for feedback

## File Structure

```
app/
  _layout.tsx          - Root layout with providers
  (tabs)/
    _layout.tsx        - Tab bar (NativeTabs / classic)
    index.tsx          - Memos screen
    tasks.tsx          - Tasks screen
    ledger.tsx         - Ledger screen
    calculator.tsx     - Calculator screen
  memo/[id].tsx        - Memo editor modal
  task/[id].tsx        - Task editor modal
context/
  AppContext.tsx        - Global state + AsyncStorage persistence
constants/
  colors.ts            - Dark/light theme palette
```
