import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  useColorScheme, Platform, Alert, Modal, TextInput, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, LedgerEntry } from "@/context/AppContext";

const CATS = ["Food", "Transport", "Shopping", "Health", "Bills", "Entertainment", "Salary", "Freelance", "Other"];
const CAT_ICONS: Record<string, string> = {
  Food: "fast-food-outline", Transport: "car-outline", Shopping: "bag-outline",
  Health: "medkit-outline", Bills: "receipt-outline", Entertainment: "game-controller-outline",
  Salary: "briefcase-outline", Freelance: "laptop-outline", Other: "ellipsis-horizontal-circle-outline",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
}
function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AddModal({ visible, onClose, onSave, C }: {
  visible: boolean; onClose: () => void;
  onSave: (e: Omit<LedgerEntry, "id">) => void; C: typeof Colors.dark;
}) {
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Other");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [note, setNote] = useState("");

  const reset = () => { setDesc(""); setAmount(""); setCat("Other"); setType("expense"); setNote(""); };

  const save = () => {
    const a = parseFloat(amount);
    if (!desc.trim() || isNaN(a) || a <= 0) {
      Alert.alert("Invalid", "Fill in description and a valid amount."); return;
    }
    onSave({ description: desc.trim(), amount: a, category: cat, type, note: note.trim(), date: Date.now() });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <View style={[mstyles.root, { backgroundColor: C.bg, paddingTop: insets.top + 16 }]}>
        <View style={mstyles.hdr}>
          <Pressable onPress={() => { reset(); onClose(); }}>
            <Text style={[mstyles.act, { color: C.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[mstyles.ttl, { color: C.text }]}>New Entry</Text>
          <Pressable onPress={save}><Text style={[mstyles.act, { color: C.accent }]}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={mstyles.typeRow}>
            {(["expense", "income"] as const).map(t => (
              <Pressable key={t} onPress={() => setType(t)}
                style={[mstyles.typeBtn, { borderColor: C.cardBorder, backgroundColor: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) + "22" : C.glass, borderWidth: type === t ? 1.5 : 1, borderColor: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) : C.cardBorder }]}>
                <Ionicons name={t === "expense" ? "arrow-up" : "arrow-down"} size={15} color={type === t ? (t === "expense" ? C.accentRed : C.accentGreen) : C.textSecondary} />
                <Text style={[mstyles.typeTxt, { color: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) : C.textSecondary }]}>{t === "expense" ? "Expense" : "Income"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[mstyles.amtBox, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[mstyles.amtSign, { color: type === "expense" ? C.accentRed : C.accentGreen }]}>{type === "expense" ? "−" : "+"}</Text>
            <TextInput
              style={[mstyles.amtInput, { color: C.text }]}
              placeholder="0.00" placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad" value={amount} onChangeText={setAmount}
            />
          </View>

          <View style={[mstyles.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[mstyles.lbl, { color: C.textMuted }]}>DESCRIPTION</Text>
            <TextInput style={[mstyles.inp, { color: C.text }]} placeholder="What was it for?" placeholderTextColor={C.textMuted} value={desc} onChangeText={setDesc} />
          </View>

          <Text style={[mstyles.secLbl, { color: C.textMuted }]}>CATEGORY</Text>
          <View style={mstyles.catGrid}>
            {CATS.map(c => (
              <Pressable key={c} onPress={() => setCat(c)}
                style={[mstyles.catChip, { backgroundColor: cat === c ? C.accent + "25" : C.glass, borderColor: cat === c ? C.accent : C.glassBorder }]}>
                <Ionicons name={CAT_ICONS[c] as any} size={12} color={cat === c ? C.accent : C.textSecondary} />
                <Text style={[mstyles.catTxt, { color: cat === c ? C.accent : C.textSecondary }]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[mstyles.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
            <Text style={[mstyles.lbl, { color: C.textMuted }]}>NOTE</Text>
            <TextInput style={[mstyles.inp, { color: C.text }]} placeholder="Optional note..." placeholderTextColor={C.textMuted} value={note} onChangeText={setNote} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const mstyles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  ttl: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  act: { fontFamily: "Inter_500Medium", fontSize: 16 },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 16 },
  typeTxt: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
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

function EntryRow({ e, onLongPress, C }: { e: LedgerEntry; onLongPress: () => void; C: typeof Colors.dark }) {
  const inc = e.type === "income";
  return (
    <Pressable onLongPress={onLongPress} style={[styles.entryRow, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={[styles.entryIcon, { backgroundColor: (inc ? C.accentGreen : C.accentRed) + "18" }]}>
        <Ionicons name={CAT_ICONS[e.category] as any} size={16} color={inc ? C.accentGreen : C.accentRed} />
      </View>
      <View style={styles.entryMeta}>
        <Text style={[styles.entryDesc, { color: C.text }]} numberOfLines={1}>{e.description}</Text>
        <Text style={[styles.entrySub, { color: C.textMuted }]}>{e.category} · {fmtDate(e.date)}</Text>
      </View>
      <Text style={[styles.entryAmt, { color: inc ? C.accentGreen : C.accentRed }]}>
        {inc ? "+" : "−"}{fmt(e.amount)}
      </Text>
    </Pressable>
  );
}

export default function LedgerScreen() {
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { ledger, addLedgerEntry, deleteLedgerEntry } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selCat, setSelCat] = useState<string | null>(null);

  const stats = useMemo(() => {
    const income = ledger.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expenses = ledger.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [ledger]);

  const filtered = useMemo(() => {
    const list = selCat ? ledger.filter(e => e.category === selCat) : ledger;
    return [...list].sort((a, b) => b.date - a.date);
  }, [ledger, selCat]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.headerWrap, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.screenTitle, { color: C.text }]}>Ledger</Text>

        <LinearGradient
          colors={isDark ? ["#1A1F3A", "#0F1225"] : ["#E8EFFF", "#F0F4FF"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.balCard, { borderColor: C.cardBorder }]}
        >
          <View style={styles.balTop}>
            <Text style={[styles.balLbl, { color: C.textSecondary }]}>Net Balance</Text>
            <Text style={[styles.balAmt, { color: stats.balance >= 0 ? C.accentGreen : C.accentRed }]}>
              {stats.balance >= 0 ? "+" : "−"}{fmt(stats.balance)}
            </Text>
          </View>
          <View style={[styles.balDivider, { backgroundColor: C.cardBorder }]} />
          <View style={styles.balRow}>
            <View style={styles.balStat}>
              <View style={styles.balStatIcon}>
                <Ionicons name="arrow-down" size={12} color={C.accentGreen} />
                <Text style={[styles.balStatLbl, { color: C.textMuted }]}>Income</Text>
              </View>
              <Text style={[styles.balStatVal, { color: C.accentGreen }]}>{fmt(stats.income)}</Text>
            </View>
            <View style={[styles.vDiv, { backgroundColor: C.cardBorder }]} />
            <View style={styles.balStat}>
              <View style={styles.balStatIcon}>
                <Ionicons name="arrow-up" size={12} color={C.accentRed} />
                <Text style={[styles.balStatLbl, { color: C.textMuted }]}>Expenses</Text>
              </View>
              <Text style={[styles.balStatVal, { color: C.accentRed }]}>{fmt(stats.expenses)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {[null, ...CATS].map(cat => {
          const active = selCat === cat;
          return (
            <Pressable key={cat ?? "all"} onPress={() => setSelCat(cat)}
              style={[styles.catPill, { backgroundColor: active ? C.accent + "25" : C.glass, borderColor: active ? C.accent : C.glassBorder }]}>
              <Text style={[styles.catPillTxt, { color: active ? C.accent : C.textSecondary }]}>{cat ?? "All"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 90, gap: 8 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyH, { color: C.textSecondary }]}>No entries</Text>
            <Text style={[styles.emptyP, { color: C.textMuted }]}>Tap + to record a transaction</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryRow e={item} C={C}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); Alert.alert("Delete Entry", `Delete "${item.description}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteLedgerEntry(item.id) }]); }}
          />
        )}
      />

      <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: C.accent, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={addLedgerEntry} C={C} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -0.8, marginBottom: 14, paddingHorizontal: 4 },
  balCard: { borderRadius: 22, padding: 18, borderWidth: 1 },
  balTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balLbl: { fontFamily: "Inter_400Regular", fontSize: 13 },
  balAmt: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5 },
  balDivider: { height: 1, marginVertical: 14 },
  balRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  balStat: { flex: 1, alignItems: "center", gap: 3 },
  balStatIcon: { flexDirection: "row", alignItems: "center", gap: 4 },
  balStatLbl: { fontFamily: "Inter_400Regular", fontSize: 12 },
  balStatVal: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  vDiv: { width: 1, height: 36 },
  catRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catPillTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  entryRow: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, borderWidth: 1, gap: 12 },
  entryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  entryMeta: { flex: 1, gap: 3 },
  entryDesc: { fontFamily: "Inter_500Medium", fontSize: 14 },
  entrySub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  entryAmt: { fontFamily: "Inter_700Bold", fontSize: 15 },
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
