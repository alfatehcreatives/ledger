import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  useColorScheme, ScrollView, Platform, Alert, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const PRIS = [
  { value: "high" as const, label: "High", color: "#F87171", icon: "arrow-up" as const },
  { value: "medium" as const, label: "Medium", color: "#F59E0B", icon: "remove" as const },
  { value: "low" as const, label: "Low", color: "#34D399", icon: "arrow-down" as const },
];

export default function TaskEditor() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { tasks, updateTask, deleteTask } = useApp();

  const task = tasks.find(t => t.id === id);
  const [title, setTitle] = useState(task?.title ?? "");
  const [desc, setDesc] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(task?.priority ?? "medium");
  const [completed, setCompleted] = useState(task?.completed ?? false);

  const save = () => { if (id) updateTask(id, { title, description: desc, priority, completed }); };
  const handleBack = () => { if (!title.trim()) deleteTask(id!); else save(); router.back(); };
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Task", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteTask(id!); router.back(); } },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={handleBack} style={styles.hBtn}>
          <Ionicons name="chevron-down" size={24} color={C.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: C.text }]}>{isNew === "true" ? "New Task" : "Edit Task"}</Text>
        <View style={styles.hActions}>
          <Pressable onPress={() => { save(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.hBtn}>
            <Ionicons name="checkmark-circle" size={22} color={C.accent} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.hBtn}>
            <Ionicons name="trash-outline" size={19} color={C.accentRed} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
          <Text style={[styles.lbl, { color: C.textMuted }]}>TASK</Text>
          <TextInput
            style={[styles.titleInp, { color: C.text }]}
            placeholder="What needs to be done?"
            placeholderTextColor={C.textMuted}
            value={title} onChangeText={setTitle}
            autoFocus={isNew === "true"} multiline
          />
        </View>

        <View style={[styles.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
          <Text style={[styles.lbl, { color: C.textMuted }]}>NOTES</Text>
          <TextInput
            style={[styles.descInp, { color: C.text }]}
            placeholder="Add details..."
            placeholderTextColor={C.textMuted}
            value={desc} onChangeText={setDesc}
            multiline textAlignVertical="top"
          />
        </View>

        <View>
          <Text style={[styles.secLbl, { color: C.textMuted }]}>PRIORITY</Text>
          <View style={styles.priRow}>
            {PRIS.map(p => {
              const active = priority === p.value;
              return (
                <Pressable key={p.value} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPriority(p.value); }}
                  style={[styles.priBtn, { backgroundColor: active ? p.color + "22" : C.glass, borderColor: active ? p.color : C.glassBorder }]}>
                  <Ionicons name={p.icon} size={14} color={active ? p.color : C.textSecondary} />
                  <Text style={[styles.priTxt, { color: active ? p.color : C.textSecondary }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.toggleRow, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
          <View style={styles.toggleLeft}>
            <Ionicons name={completed ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color={completed ? C.accentGreen : C.textSecondary} />
            <Text style={[styles.toggleLbl, { color: C.text }]}>Mark as Complete</Text>
          </View>
          <Switch
            value={completed}
            onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCompleted(v); }}
            trackColor={{ false: C.glassBorder, true: C.accentGreen + "55" }}
            thumbColor={completed ? C.accentGreen : C.textMuted}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12 },
  hBtn: { padding: 8 },
  hTitle: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" },
  hActions: { flexDirection: "row", gap: 2 },
  field: { borderRadius: 16, padding: 16, borderWidth: 1 },
  lbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 8 },
  titleInp: { fontFamily: "Inter_600SemiBold", fontSize: 20, lineHeight: 28 },
  descInp: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, minHeight: 80 },
  secLbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 10, paddingHorizontal: 2 },
  priRow: { flexDirection: "row", gap: 10 },
  priBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  priTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 16, padding: 16, borderWidth: 1 },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLbl: { fontFamily: "Inter_500Medium", fontSize: 16 },
});
