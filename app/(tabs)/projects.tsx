import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  useColorScheme, Platform, Alert, Modal, TextInput, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, Project } from "@/context/AppContext";

const PROJECT_COLORS = [
  "#4F8EF7", "#A78BFA", "#34D399", "#F59E0B",
  "#F87171", "#60A5FA", "#FB923C", "#4ADE80",
];

const PROJECT_ICONS = [
  "storefront-outline", "build-outline", "home-outline", "car-outline",
  "laptop-outline", "school-outline", "heart-outline", "rocket-outline",
  "briefcase-outline", "leaf-outline", "restaurant-outline", "medical-outline",
];

function CreateModal({ visible, onClose, onSave, C }: {
  visible: boolean; onClose: () => void;
  onSave: (p: Omit<Project, "id" | "createdAt">) => void;
  C: typeof Colors.dark;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);

  const reset = () => { setName(""); setDesc(""); setBudget(""); setColor(PROJECT_COLORS[0]); setIcon(PROJECT_ICONS[0]); };

  const save = () => {
    const b = parseFloat(budget);
    if (!name.trim()) { Alert.alert("Required", "Project name is required."); return; }
    if (isNaN(b) || b <= 0) { Alert.alert("Invalid", "Enter a valid budget amount."); return; }
    onSave({ name: name.trim(), description: desc.trim(), budget: b, color, icon });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <View style={[ms.root, { backgroundColor: C.bg, paddingTop: insets.top + 16 }]}>
        <View style={ms.hdr}>
          <Pressable onPress={() => { reset(); onClose(); }}><Text style={[ms.act, { color: C.textSecondary }]}>Cancel</Text></Pressable>
          <Text style={[ms.ttl, { color: C.text }]}>New Project</Text>
          <Pressable onPress={save}><Text style={[ms.act, { color: C.accent }]}>Create</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={[ms.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[ms.lbl, { color: C.textMuted }]}>PROJECT NAME</Text>
            <TextInput style={[ms.inp, { color: C.text }]} placeholder="e.g. Shop Build" placeholderTextColor={C.textMuted} value={name} onChangeText={setName} autoFocus />
          </View>

          <View style={[ms.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[ms.lbl, { color: C.textMuted }]}>DESCRIPTION</Text>
            <TextInput style={[ms.inp, { color: C.text }]} placeholder="What's this project for?" placeholderTextColor={C.textMuted} value={desc} onChangeText={setDesc} />
          </View>

          <View style={[ms.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[ms.lbl, { color: C.textMuted }]}>TOTAL BUDGET</Text>
            <View style={ms.budgetRow}>
              <TextInput style={[ms.budgetInp, { color: C.text }]} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
            </View>
          </View>

          <Text style={[ms.secLbl, { color: C.textMuted }]}>COLOR</Text>
          <View style={ms.colorGrid}>
            {PROJECT_COLORS.map(c => (
              <Pressable key={c} onPress={() => setColor(c)}
                style={[ms.colorDot, { backgroundColor: c }, color === c && ms.colorDotActive]}>
                {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </Pressable>
            ))}
          </View>

          <Text style={[ms.secLbl, { color: C.textMuted }]}>ICON</Text>
          <View style={ms.iconGrid}>
            {PROJECT_ICONS.map(ic => (
              <Pressable key={ic} onPress={() => setIcon(ic)}
                style={[ms.iconBtn, { backgroundColor: icon === ic ? color + "30" : C.glass, borderColor: icon === ic ? color : C.glassBorder }]}>
                <Ionicons name={ic as any} size={20} color={icon === ic ? color : C.textSecondary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  ttl: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  act: { fontFamily: "Inter_500Medium", fontSize: 16 },
  field: { borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1 },
  lbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 7 },
  inp: { fontFamily: "Inter_400Regular", fontSize: 16 },
  budgetRow: { flexDirection: "row", alignItems: "center" },
  budgetInp: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5, flex: 1 },
  secLbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 10, paddingHorizontal: 2 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorDotActive: { shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  iconBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const clamp = Math.min(1, Math.max(0, pct));
  const fill = Math.round(clamp * 100);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: color + "30", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${fill}%`, backgroundColor: color + "30" }} />
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color }}>{fill}%</Text>
      </View>
    </View>
  );
}

function ProjectCard({ p, spent, C, onPress, onLongPress }: {
  p: Project; spent: number; C: typeof Colors.dark; onPress: () => void; onLongPress: () => void;
}) {
  const pct = p.budget > 0 ? spent / p.budget : 0;
  const remaining = p.budget - spent;
  const over = remaining < 0;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n));

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}
      style={({ pressed }) => [styles.projCard, { backgroundColor: C.card, borderColor: C.cardBorder, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.projIconWrap, { backgroundColor: p.color + "20" }]}>
        <Ionicons name={p.icon as any} size={22} color={p.color} />
      </View>
      <View style={styles.projBody}>
        <Text style={[styles.projName, { color: C.text }]} numberOfLines={1}>{p.name}</Text>
        {p.description.length > 0 && <Text style={[styles.projDesc, { color: C.textSecondary }]} numberOfLines={1}>{p.description}</Text>}
        <View style={styles.projBar}>
          <View style={[styles.projBarBg, { backgroundColor: p.color + "20" }]}>
            <View style={[styles.projBarFill, { width: `${Math.min(100, pct * 100)}%`, backgroundColor: over ? C.accentRed : p.color }]} />
          </View>
        </View>
        <View style={styles.projStats}>
          <Text style={[styles.projSpent, { color: C.textSecondary }]}>Spent: <Text style={{ color: C.text, fontFamily: "Inter_600SemiBold" }}>{fmt(spent)}</Text></Text>
          <Text style={[styles.projRemain, { color: over ? C.accentRed : C.accentGreen }]}>
            {over ? `Over by ${fmt(Math.abs(remaining))}` : `Left: ${fmt(remaining)}`}
          </Text>
        </View>
      </View>
      <View style={styles.projRight}>
        <ProgressRing pct={pct} color={over ? C.accentRed : p.color} size={50} />
        <Text style={[styles.projBudget, { color: C.textMuted }]}>{fmt(p.budget)}</Text>
      </View>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { projects, projectEntries, addProject, deleteProject } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  const spentMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of projectEntries) {
      m[e.projectId] = (m[e.projectId] ?? 0) + e.amount;
    }
    return m;
  }, [projectEntries]);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + (spentMap[p.id] ?? 0), 0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLongPress = (p: Project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Project", `Delete "${p.name}" and all its entries?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProject(p.id) },
    ]);
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.headerWrap, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.screenTitle, { color: C.text }]}>Projects</Text>

        {projects.length > 0 && (
          <LinearGradient
            colors={isDark ? ["#1A1628", "#0F1020"] : ["#F0EBFF", "#F5F0FF"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.summaryCard, { borderColor: C.cardBorder }]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLbl, { color: C.textMuted }]}>Total Budgets</Text>
                <Text style={[styles.summaryVal, { color: C.text }]}>{fmt(totalBudget)}</Text>
              </View>
              <View style={[styles.vDiv, { backgroundColor: C.cardBorder }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLbl, { color: C.textMuted }]}>Total Spent</Text>
                <Text style={[styles.summaryVal, { color: C.accentRed }]}>{fmt(totalSpent)}</Text>
              </View>
              <View style={[styles.vDiv, { backgroundColor: C.cardBorder }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLbl, { color: C.textMuted }]}>Remaining</Text>
                <Text style={[styles.summaryVal, { color: C.accentGreen }]}>{fmt(totalBudget - totalSpent)}</Text>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>

      <FlatList
        data={projects}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 90, gap: 10 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!projects.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={52} color={C.textMuted} />
            <Text style={[styles.emptyH, { color: C.textSecondary }]}>No projects yet</Text>
            <Text style={[styles.emptyP, { color: C.textMuted }]}>Create a budget envelope for any goal</Text>
            <Text style={[styles.emptyHint, { color: C.textMuted }]}>e.g. Shop Build — ₹1,00,000 budget</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProjectCard p={item} spent={spentMap[item.id] ?? 0} C={C}
            onPress={() => router.push({ pathname: "/project/[id]", params: { id: item.id } })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
      />

      <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: C.accentPurple, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCreate(true); }}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} onSave={addProject} C={C} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -0.8, marginBottom: 14, paddingHorizontal: 4 },
  summaryCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryLbl: { fontFamily: "Inter_400Regular", fontSize: 11 },
  summaryVal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  vDiv: { width: 1, height: 36 },
  projCard: { flexDirection: "row", borderRadius: 20, padding: 16, borderWidth: 1, gap: 14, alignItems: "center" },
  projIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  projBody: { flex: 1, gap: 4 },
  projName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  projDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  projBar: { marginTop: 4 },
  projBarBg: { height: 4, borderRadius: 2, overflow: "hidden", width: "100%" },
  projBarFill: { height: 4, borderRadius: 2 },
  projStats: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  projSpent: { fontFamily: "Inter_400Regular", fontSize: 11 },
  projRemain: { fontFamily: "Inter_500Medium", fontSize: 11 },
  projRight: { alignItems: "center", gap: 4 },
  projBudget: { fontFamily: "Inter_400Regular", fontSize: 10 },
  empty: { alignItems: "center", paddingTop: 80, gap: 6 },
  emptyH: { fontFamily: "Inter_600SemiBold", fontSize: 17, marginTop: 10 },
  emptyP: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, opacity: 0.7 },
  fab: {
    position: "absolute", bottom: 100, right: 20,
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#A78BFA", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
});
