import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  useColorScheme, Platform, Alert, Modal, TextInput, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, ProjectEntry } from "@/context/AppContext";

const CATS = ["Materials", "Labor", "Equipment", "Transport", "Permits", "Marketing", "Rent", "Utilities", "Other"];
const CAT_ICONS: Record<string, string> = {
  Materials: "cube-outline", Labor: "people-outline", Equipment: "construct-outline",
  Transport: "car-outline", Permits: "document-text-outline", Marketing: "megaphone-outline",
  Rent: "home-outline", Utilities: "flash-outline", Other: "ellipsis-horizontal-circle-outline",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
}
function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AddEntryModal({ visible, onClose, onSave, projectColor, C }: {
  visible: boolean; onClose: () => void;
  onSave: (e: Omit<ProjectEntry, "id" | "projectId">) => void;
  projectColor: string; C: typeof Colors.dark;
}) {
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Other");
  const [note, setNote] = useState("");

  const reset = () => { setDesc(""); setAmount(""); setCat("Other"); setNote(""); };

  const save = () => {
    const a = parseFloat(amount);
    if (!desc.trim() || isNaN(a) || a <= 0) {
      Alert.alert("Invalid", "Fill in description and a valid amount."); return;
    }
    onSave({ description: desc.trim(), amount: a, category: cat, note: note.trim(), date: Date.now() });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <View style={[es.root, { backgroundColor: C.bg, paddingTop: insets.top + 16 }]}>
        <View style={es.hdr}>
          <Pressable onPress={() => { reset(); onClose(); }}><Text style={[es.act, { color: C.textSecondary }]}>Cancel</Text></Pressable>
          <Text style={[es.ttl, { color: C.text }]}>Add Expense</Text>
          <Pressable onPress={save}><Text style={[es.act, { color: projectColor }]}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={[es.amtBox, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[es.amtSign, { color: projectColor }]}>−</Text>
            <TextInput style={[es.amtInput, { color: C.text }]} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>

          <View style={[es.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[es.lbl, { color: C.textMuted }]}>DESCRIPTION</Text>
            <TextInput style={[es.inp, { color: C.text }]} placeholder="What was this for?" placeholderTextColor={C.textMuted} value={desc} onChangeText={setDesc} />
          </View>

          <Text style={[es.secLbl, { color: C.textMuted }]}>CATEGORY</Text>
          <View style={es.catGrid}>
            {CATS.map(c => (
              <Pressable key={c} onPress={() => setCat(c)}
                style={[es.catChip, { backgroundColor: cat === c ? projectColor + "25" : C.glass, borderColor: cat === c ? projectColor : C.glassBorder }]}>
                <Ionicons name={CAT_ICONS[c] as any} size={12} color={cat === c ? projectColor : C.textSecondary} />
                <Text style={[es.catTxt, { color: cat === c ? projectColor : C.textSecondary }]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[es.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[es.lbl, { color: C.textMuted }]}>NOTE</Text>
            <TextInput style={[es.inp, { color: C.text }]} placeholder="Optional note..." placeholderTextColor={C.textMuted} value={note} onChangeText={setNote} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const es = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  ttl: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  act: { fontFamily: "Inter_500Medium", fontSize: 16 },
  amtBox: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  amtSign: { fontFamily: "Inter_700Bold", fontSize: 34, marginRight: 4 },
  amtInput: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 36, letterSpacing: -1 },
  field: { borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1 },
  lbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 7 },
  inp: { fontFamily: "Inter_400Regular", fontSize: 16 },
  secLbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 10, paddingHorizontal: 2 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
});

function EntryCard({ e, color, onLongPress, C }: { e: ProjectEntry; color: string; onLongPress: () => void; C: typeof Colors.dark }) {
  return (
    <Pressable onLongPress={onLongPress} style={[styles.entryCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={[styles.entryIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={(CAT_ICONS[e.category] ?? "ellipsis-horizontal-circle-outline") as any} size={16} color={color} />
      </View>
      <View style={styles.entryBody}>
        <Text style={[styles.entryDesc, { color: C.text }]} numberOfLines={1}>{e.description}</Text>
        <Text style={[styles.entrySub, { color: C.textMuted }]}>{e.category} · {fmtDate(e.date)}</Text>
      </View>
      <Text style={[styles.entryAmt, { color }]}>−{fmt(e.amount)}</Text>
    </Pressable>
  );
}

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { projects, projectEntries, addProjectEntry, deleteProjectEntry, deleteProject } = useApp();

  const project = projects.find(p => p.id === id);
  const entries = useMemo(() => projectEntries.filter(e => e.projectId === id).sort((a, b) => b.date - a.date), [projectEntries, id]);
  const spent = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);
  const [showAdd, setShowAdd] = useState(false);

  if (!project) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: C.text, fontFamily: "Inter_400Regular" }}>Project not found</Text>
      </View>
    );
  }

  const remaining = project.budget - spent;
  const pct = project.budget > 0 ? Math.min(1, spent / project.budget) : 0;
  const over = remaining < 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = () => {
    Alert.alert("Delete Project", `Delete "${project.name}" and all its expenses?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteProject(project.id); router.back(); } },
    ]);
  };

  const catTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [entries]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: C.text }]} numberOfLines={1}>{project.name}</Text>
        <Pressable onPress={handleDelete} style={styles.hBtn}>
          <Ionicons name="trash-outline" size={20} color={C.accentRed} />
        </Pressable>
      </View>

      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 90, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <LinearGradient
              colors={isDark ? [`${project.color}25`, `${project.color}10`] : [`${project.color}18`, `${project.color}08`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderColor: project.color + "30" }]}
            >
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: project.color + "20" }]}>
                  <Ionicons name={project.icon as any} size={28} color={project.color} />
                </View>
                <View style={styles.heroInfo}>
                  {project.description.length > 0 && (
                    <Text style={[styles.heroDesc, { color: C.textSecondary }]}>{project.description}</Text>
                  )}
                  <Text style={[styles.heroBudget, { color: C.textMuted }]}>Budget: <Text style={{ color: C.text, fontFamily: "Inter_600SemiBold" }}>{fmt(project.budget)}</Text></Text>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: over ? C.accentRed : project.color }]}>{fmt(spent)}</Text>
                  <Text style={[styles.heroStatLbl, { color: C.textMuted }]}>Spent</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: over ? C.accentRed : C.accentGreen }]}>
                    {over ? "−" : ""}{fmt(Math.abs(remaining))}
                  </Text>
                  <Text style={[styles.heroStatLbl, { color: C.textMuted }]}>{over ? "Over budget" : "Remaining"}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: C.text }]}>{entries.length}</Text>
                  <Text style={[styles.heroStatLbl, { color: C.textMuted }]}>Entries</Text>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: project.color + "20" }]}>
                <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: over ? C.accentRed : project.color }]} />
              </View>
              <Text style={[styles.progressLabel, { color: C.textMuted }]}>{Math.round(pct * 100)}% of budget used</Text>
            </LinearGradient>

            {catTotals.length > 0 && (
              <View style={styles.breakdownWrap}>
                <Text style={[styles.sectionLbl, { color: C.textMuted }]}>BREAKDOWN</Text>
                <View style={styles.breakdownGrid}>
                  {catTotals.map(([cat, total]) => (
                    <View key={cat} style={[styles.breakChip, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                      <Ionicons name={(CAT_ICONS[cat] ?? "ellipsis-horizontal-circle-outline") as any} size={13} color={project.color} />
                      <Text style={[styles.breakCat, { color: C.textSecondary }]}>{cat}</Text>
                      <Text style={[styles.breakAmt, { color: C.text }]}>{fmt(total)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {entries.length > 0 && <Text style={[styles.sectionLbl, { color: C.textMuted, paddingHorizontal: 4, marginBottom: 4 }]}>ALL EXPENSES</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={46} color={C.textMuted} />
            <Text style={[styles.emptyH, { color: C.textSecondary }]}>No expenses yet</Text>
            <Text style={[styles.emptyP, { color: C.textMuted }]}>Tap + to record your first expense</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryCard e={item} color={project.color} C={C}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); Alert.alert("Delete Entry", `Delete "${item.description}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteProjectEntry(item.id) }]); }}
          />
        )}
      />

      <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: project.color, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <AddEntryModal
        visible={showAdd} onClose={() => setShowAdd(false)}
        onSave={entry => addProjectEntry({ ...entry, projectId: id! })}
        projectColor={project.color} C={C}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  hBtn: { padding: 8, width: 40, alignItems: "center" },
  hTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: -0.3, textAlign: "center" },
  listHeader: { gap: 14, marginBottom: 8 },
  heroCard: { borderRadius: 22, padding: 20, borderWidth: 1, gap: 14 },
  heroTop: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  heroIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroInfo: { flex: 1, gap: 4 },
  heroDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  heroBudget: { fontFamily: "Inter_400Regular", fontSize: 13 },
  heroStats: { flexDirection: "row", justifyContent: "space-around" },
  heroStat: { alignItems: "center", gap: 3 },
  heroStatVal: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.5 },
  heroStatLbl: { fontFamily: "Inter_400Regular", fontSize: 11 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "right" },
  breakdownWrap: { gap: 8 },
  sectionLbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6 },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breakChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  breakCat: { fontFamily: "Inter_400Regular", fontSize: 12 },
  breakAmt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  entryCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, borderWidth: 1, gap: 12 },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entryBody: { flex: 1, gap: 2 },
  entryDesc: { fontFamily: "Inter_500Medium", fontSize: 14 },
  entrySub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  entryAmt: { fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 40, gap: 6 },
  emptyH: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 8 },
  emptyP: { fontFamily: "Inter_400Regular", fontSize: 13 },
  fab: {
    position: "absolute", bottom: 32, right: 20,
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
});
