import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  useColorScheme, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, Task } from "@/context/AppContext";

type Filter = "all" | "pending" | "done";

const PRI = {
  high: { color: "#F87171", icon: "arrow-up" as const, label: "High" },
  medium: { color: "#F59E0B", icon: "remove" as const, label: "Med" },
  low: { color: "#34D399", icon: "arrow-down" as const, label: "Low" },
};

function due(ts: number | null): { label: string; overdue: boolean } {
  if (!ts) return { label: "", overdue: false };
  const diff = Math.ceil((ts - Date.now()) / 86400000);
  if (diff < 0) return { label: "Overdue", overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  if (diff === 1) return { label: "Due tomorrow", overdue: false };
  const d = new Date(ts);
  return { label: `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, overdue: false };
}

function TaskRow({ task, onToggle, onPress, onLongPress, C }: {
  task: Task; onToggle: () => void; onPress: () => void; onLongPress: () => void; C: typeof Colors.dark;
}) {
  const p = PRI[task.priority];
  const { label: dueLabel, overdue } = due(task.dueDate);
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row, { backgroundColor: C.card, borderColor: C.cardBorder, opacity: pressed ? 0.8 : task.completed ? 0.5 : 1 },
      ]}
    >
      <Pressable
        onPress={onToggle}
        style={[styles.check, { borderColor: task.completed ? C.accentGreen : C.cardBorderStrong, backgroundColor: task.completed ? C.accentGreen + "22" : "transparent" }]}
      >
        {task.completed && <Ionicons name="checkmark" size={12} color={C.accentGreen} />}
      </Pressable>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: C.text, textDecorationLine: task.completed ? "line-through" : "none" }]} numberOfLines={1}>
          {task.title || "Untitled"}
        </Text>
        {task.description.length > 0 && (
          <Text style={[styles.rowSub, { color: C.textSecondary }]} numberOfLines={1}>{task.description}</Text>
        )}
        {dueLabel.length > 0 && (
          <Text style={[styles.rowDue, { color: overdue ? C.accentRed : C.textMuted }]}>{dueLabel}</Text>
        )}
      </View>
      <View style={[styles.priBadge, { backgroundColor: p.color + "20", borderColor: p.color + "40" }]}>
        <Ionicons name={p.icon} size={11} color={p.color} />
        <Text style={[styles.priTxt, { color: p.color }]}>{p.label}</Text>
      </View>
    </Pressable>
  );
}

export default function TasksScreen() {
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, deleteTask, addTask } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const list = filter === "pending" ? tasks.filter(t => !t.completed)
      : filter === "done" ? tasks.filter(t => t.completed) : tasks;
    return [...list].sort((a, b) => {
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      const o = { high: 0, medium: 1, low: 2 };
      return o[a.priority] - o[b.priority];
    });
  }, [tasks, filter]);

  const pending = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const t = addTask({ title: "", description: "", priority: "medium", dueDate: null, completed: false });
    router.push({ pathname: "/task/[id]", params: { id: t.id, isNew: "true" } });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View>
          <Text style={[styles.screenTitle, { color: C.text }]}>Tasks</Text>
        </View>
        <View style={styles.stats}>
          <View style={[styles.statPill, { backgroundColor: C.accentRed + "18", borderColor: C.accentRed + "30" }]}>
            <Text style={[styles.statNum, { color: C.accentRed }]}>{pending}</Text>
            <Text style={[styles.statLbl, { color: C.accentRed }]}>open</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: C.accentGreen + "18", borderColor: C.accentGreen + "30" }]}>
            <Text style={[styles.statNum, { color: C.accentGreen }]}>{done}</Text>
            <Text style={[styles.statLbl, { color: C.accentGreen }]}>done</Text>
          </View>
        </View>
      </View>

      <View style={styles.filters}>
        {(["all", "pending", "done"] as Filter[]).map(f => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, { borderColor: filter === f ? C.accent : C.cardBorder, backgroundColor: filter === f ? C.accent + "22" : C.glass }]}
          >
            <Text style={[styles.filterTxt, { color: filter === f ? C.accent : C.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 90, gap: 8 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkbox-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyH, { color: C.textSecondary }]}>{filter === "all" ? "No tasks" : `No ${filter} tasks`}</Text>
            <Text style={[styles.emptyP, { color: C.textMuted }]}>{filter === "all" ? "Tap + to add one" : "All clear!"}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTask(item.id); }}
            onPress={() => router.push({ pathname: "/task/[id]", params: { id: item.id } })}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); Alert.alert("Delete Task", `Delete "${item.title || "Untitled"}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteTask(item.id) }]); }}
            C={C}
          />
        )}
      />

      <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: C.accent, transform: [{ scale: pressed ? 0.9 : 1 }] }]} onPress={handleNew}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  screenTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  stats: { flexDirection: "row", gap: 8 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 14 },
  statLbl: { fontFamily: "Inter_400Regular", fontSize: 12 },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, borderWidth: 1, gap: 12 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  rowDue: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  priBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  priTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80, gap: 6 },
  emptyH: { fontFamily: "Inter_600SemiBold", fontSize: 17, marginTop: 10 },
  emptyP: { fontFamily: "Inter_400Regular", fontSize: 14 },
  fab: {
    position: "absolute", bottom: 100, right: 20,
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4F8EF7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
});
