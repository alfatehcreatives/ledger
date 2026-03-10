import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MemoTag = "personal" | "work" | "ideas" | "important";

export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: MemoTag[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: number | null;
  completed: boolean;
  createdAt: number;
}

export interface LedgerEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: number;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  color: string;
  icon: string;
  createdAt: number;
}

export interface ProjectEntry {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  date: number;
  note: string;
}

interface AppContextValue {
  memos: Memo[];
  tasks: Task[];
  ledger: LedgerEntry[];
  projects: Project[];
  projectEntries: ProjectEntry[];
  loading: boolean;
  addMemo: (memo: Omit<Memo, "id" | "createdAt" | "updatedAt">) => Memo;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, "id">) => void;
  updateLedgerEntry: (id: string, updates: Partial<LedgerEntry>) => void;
  deleteLedgerEntry: (id: string) => void;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectEntry: (entry: Omit<ProjectEntry, "id">) => void;
  deleteProjectEntry: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const KEYS = {
  memos: "@nv/memos",
  tasks: "@nv/tasks",
  ledger: "@nv/ledger",
  projects: "@nv/projects",
  projectEntries: "@nv/projectEntries",
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, t, l, p, pe] = await Promise.all([
          AsyncStorage.getItem(KEYS.memos),
          AsyncStorage.getItem(KEYS.tasks),
          AsyncStorage.getItem(KEYS.ledger),
          AsyncStorage.getItem(KEYS.projects),
          AsyncStorage.getItem(KEYS.projectEntries),
        ]);
        if (m) setMemos(JSON.parse(m));
        if (t) setTasks(JSON.parse(t));
        if (l) setLedger(JSON.parse(l));
        if (p) setProjects(JSON.parse(p));
        if (pe) setProjectEntries(JSON.parse(pe));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((key: string, data: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  // ─── Memos ───────────────────────────────────────────────────────────────
  const addMemo = useCallback((m: Omit<Memo, "id" | "createdAt" | "updatedAt">): Memo => {
    const now = Date.now();
    const nm: Memo = { ...m, id: genId(), createdAt: now, updatedAt: now };
    setMemos(prev => { const u = [nm, ...prev]; persist(KEYS.memos, u); return u; });
    return nm;
  }, [persist]);

  const updateMemo = useCallback((id: string, upd: Partial<Memo>) => {
    setMemos(prev => { const u = prev.map(x => x.id === id ? { ...x, ...upd, updatedAt: Date.now() } : x); persist(KEYS.memos, u); return u; });
  }, [persist]);

  const deleteMemo = useCallback((id: string) => {
    setMemos(prev => { const u = prev.filter(x => x.id !== id); persist(KEYS.memos, u); return u; });
  }, [persist]);

  // ─── Tasks ───────────────────────────────────────────────────────────────
  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">): Task => {
    const nt: Task = { ...t, id: genId(), createdAt: Date.now() };
    setTasks(prev => { const u = [nt, ...prev]; persist(KEYS.tasks, u); return u; });
    return nt;
  }, [persist]);

  const updateTask = useCallback((id: string, upd: Partial<Task>) => {
    setTasks(prev => { const u = prev.map(x => x.id === id ? { ...x, ...upd } : x); persist(KEYS.tasks, u); return u; });
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => { const u = prev.filter(x => x.id !== id); persist(KEYS.tasks, u); return u; });
  }, [persist]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => { const u = prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x); persist(KEYS.tasks, u); return u; });
  }, [persist]);

  // ─── Ledger ──────────────────────────────────────────────────────────────
  const addLedgerEntry = useCallback((e: Omit<LedgerEntry, "id">) => {
    const ne: LedgerEntry = { ...e, id: genId() };
    setLedger(prev => { const u = [ne, ...prev]; persist(KEYS.ledger, u); return u; });
  }, [persist]);

  const updateLedgerEntry = useCallback((id: string, upd: Partial<LedgerEntry>) => {
    setLedger(prev => { const u = prev.map(x => x.id === id ? { ...x, ...upd } : x); persist(KEYS.ledger, u); return u; });
  }, [persist]);

  const deleteLedgerEntry = useCallback((id: string) => {
    setLedger(prev => { const u = prev.filter(x => x.id !== id); persist(KEYS.ledger, u); return u; });
  }, [persist]);

  // ─── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback((p: Omit<Project, "id" | "createdAt">): Project => {
    const np: Project = { ...p, id: genId(), createdAt: Date.now() };
    setProjects(prev => { const u = [np, ...prev]; persist(KEYS.projects, u); return u; });
    return np;
  }, [persist]);

  const updateProject = useCallback((id: string, upd: Partial<Project>) => {
    setProjects(prev => { const u = prev.map(x => x.id === id ? { ...x, ...upd } : x); persist(KEYS.projects, u); return u; });
  }, [persist]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => { const u = prev.filter(x => x.id !== id); persist(KEYS.projects, u); return u; });
    setProjectEntries(prev => { const u = prev.filter(x => x.projectId !== id); persist(KEYS.projectEntries, u); return u; });
  }, [persist]);

  const addProjectEntry = useCallback((e: Omit<ProjectEntry, "id">) => {
    const ne: ProjectEntry = { ...e, id: genId() };
    setProjectEntries(prev => { const u = [ne, ...prev]; persist(KEYS.projectEntries, u); return u; });
  }, [persist]);

  const deleteProjectEntry = useCallback((id: string) => {
    setProjectEntries(prev => { const u = prev.filter(x => x.id !== id); persist(KEYS.projectEntries, u); return u; });
  }, [persist]);

  return (
    <AppContext.Provider value={{
      memos, tasks, ledger, projects, projectEntries, loading,
      addMemo, updateMemo, deleteMemo,
      addTask, updateTask, deleteTask, toggleTask,
      addLedgerEntry, updateLedgerEntry, deleteLedgerEntry,
      addProject, updateProject, deleteProject,
      addProjectEntry, deleteProjectEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
