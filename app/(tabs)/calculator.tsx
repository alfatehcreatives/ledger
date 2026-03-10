import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, useColorScheme,
  Platform, Alert, Modal, TextInput, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, LedgerEntry } from "@/context/AppContext";

const CATS = ["Food", "Transport", "Shopping", "Health", "Bills", "Entertainment", "Salary", "Freelance", "Other"];

function calc(expr: string): number {
  try {
    const s = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    const r = Function('"use strict"; return (' + s + ')')();
    return typeof r === "number" && isFinite(r) ? r : NaN;
  } catch { return NaN; }
}

function fmtResult(v: number): string {
  if (isNaN(v) || !isFinite(v)) return "Error";
  const s = v.toString();
  return s.length > 12 ? parseFloat(v.toPrecision(10)).toString() : s;
}

type BtnType = "num" | "op" | "act" | "eq";

const ROWS: { label: string; type: BtnType }[][] = [
  [{ label: "AC", type: "act" }, { label: "+/−", type: "act" }, { label: "%", type: "act" }, { label: "÷", type: "op" }],
  [{ label: "7", type: "num" }, { label: "8", type: "num" }, { label: "9", type: "num" }, { label: "×", type: "op" }],
  [{ label: "4", type: "num" }, { label: "5", type: "num" }, { label: "6", type: "num" }, { label: "−", type: "op" }],
  [{ label: "1", type: "num" }, { label: "2", type: "num" }, { label: "3", type: "num" }, { label: "+", type: "op" }],
  [{ label: "0", type: "num" }, { label: ".", type: "num" }, { label: "⌫", type: "act" }, { label: "=", type: "eq" }],
];

function LedgerModal({ visible, onClose, onSave, amount, C }: {
  visible: boolean; onClose: () => void;
  onSave: (e: Omit<LedgerEntry, "id">) => void;
  amount: number; C: typeof Colors.dark;
}) {
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Other");
  const [type, setType] = useState<"income" | "expense">("expense");

  const save = () => {
    if (!desc.trim()) { Alert.alert("Required", "Add a description."); return; }
    onSave({ description: desc.trim(), amount, category: cat, type, note: "", date: Date.now() });
    setDesc(""); setCat("Other"); setType("expense"); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setDesc(""); onClose(); }}>
      <View style={[ls.root, { backgroundColor: C.bg, paddingTop: insets.top + 16 }]}>
        <View style={ls.hdr}>
          <Pressable onPress={() => { setDesc(""); onClose(); }}><Text style={[ls.act, { color: C.textSecondary }]}>Cancel</Text></Pressable>
          <Text style={[ls.ttl, { color: C.text }]}>Add to Ledger</Text>
          <Pressable onPress={save}><Text style={[ls.act, { color: C.accent }]}>Save</Text></Pressable>
        </View>
        <View style={[ls.amtBox, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
          <Text style={[ls.amtLbl, { color: C.textMuted }]}>Amount</Text>
          <Text style={[ls.amtVal, { color: type === "expense" ? C.accentRed : C.accentGreen }]}>
            {type === "expense" ? "−" : "+"}{new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(Math.abs(amount))}
          </Text>
        </View>
        <View style={ls.typeRow}>
          {(["expense", "income"] as const).map(t => (
            <Pressable key={t} onPress={() => setType(t)}
              style={[ls.typeBtn, { borderColor: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) : C.cardBorder, backgroundColor: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) + "22" : C.glass }]}>
              <Text style={[ls.typeTxt, { color: type === t ? (t === "expense" ? C.accentRed : C.accentGreen) : C.textSecondary }]}>
                {t === "expense" ? "Expense" : "Income"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[ls.field, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
          <TextInput style={[ls.inp, { color: C.text }]} placeholder="Description..." placeholderTextColor={C.textMuted} value={desc} onChangeText={setDesc} autoFocus />
        </View>
        <Text style={[ls.lbl, { color: C.textMuted }]}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {CATS.map(c => (
            <Pressable key={c} onPress={() => setCat(c)}
              style={[ls.catChip, { backgroundColor: cat === c ? C.accent + "25" : C.glass, borderColor: cat === c ? C.accent : C.glassBorder }]}>
              <Text style={[ls.catTxt, { color: cat === c ? C.accent : C.textSecondary }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  ttl: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  act: { fontFamily: "Inter_500Medium", fontSize: 16 },
  amtBox: { borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  amtLbl: { fontFamily: "Inter_400Regular", fontSize: 13 },
  amtVal: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -1 },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  typeTxt: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  field: { borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1 },
  inp: { fontFamily: "Inter_400Regular", fontSize: 16 },
  lbl: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.6, marginBottom: 10 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
});

export default function CalcScreen() {
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { addLedgerEntry } = useApp();

  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("0");
  const [evaled, setEvaled] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const press = useCallback((label: string, type: BtnType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (label === "AC") { setExpr(""); setResult("0"); setEvaled(false); return; }
    if (label === "⌫") {
      if (evaled) { setExpr(""); setResult("0"); setEvaled(false); return; }
      const n = expr.slice(0, -1);
      setExpr(n);
      if (!n) { setResult("0"); return; }
      const v = calc(n); if (!isNaN(v)) setResult(fmtResult(v));
      return;
    }
    if (label === "=") {
      const v = calc(expr);
      if (!isNaN(v)) { setResult(fmtResult(v)); setExpr(fmtResult(v)); setEvaled(true); }
      else setResult("Error");
      return;
    }
    if (label === "+/−") {
      if (result !== "0" && result !== "Error") { const v = parseFloat(result) * -1; setResult(fmtResult(v)); setExpr(String(v)); } return;
    }
    if (label === "%") {
      const v = calc(expr);
      if (!isNaN(v)) { const p = v / 100; setResult(fmtResult(p)); setExpr(String(p)); setEvaled(true); } return;
    }
    const isOp = ["÷", "×", "−", "+"].includes(label);
    let ne = expr;
    if (evaled && !isOp) { ne = label; setEvaled(false); }
    else if (evaled && isOp) { setEvaled(false); ne = expr + label; }
    else { ne = expr + label; }
    setExpr(ne);
    const v = calc(ne); if (!isNaN(v)) setResult(fmtResult(v));
  }, [expr, result, evaled]);

  const numResult = parseFloat(result);
  const canLedger = !isNaN(numResult) && numResult !== 0 && result !== "Error";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.display, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.exprTxt, { color: C.textSecondary }]} numberOfLines={2} adjustsFontSizeToFit>
          {expr || " "}
        </Text>
        <Text style={[styles.resultTxt, { color: C.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {result}
        </Text>
        {canLedger && (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowLedger(true); }}
            style={({ pressed }) => [styles.ledgerBtn, { backgroundColor: C.accentGold + "20", borderColor: C.accentGold + "45", opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="wallet-outline" size={13} color={C.accentGold} />
            <Text style={[styles.ledgerTxt, { color: C.accentGold }]}>Add to Ledger</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.keyboard, { paddingBottom: botPad + 90 }]}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={styles.kRow}>
            {row.map(btn => {
              const isOp = btn.type === "op";
              const isEq = btn.type === "eq";
              const isAct = btn.type === "act";
              const isZero = btn.label === "0";
              return (
                <Pressable
                  key={btn.label}
                  onPress={() => press(btn.label, btn.type)}
                  style={({ pressed }) => [
                    styles.kBtn,
                    isZero && styles.kBtnWide,
                    {
                      opacity: pressed ? 0.75 : 1,
                      backgroundColor:
                        isEq ? C.accent
                          : isOp ? C.accent + "22"
                          : isAct ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)")
                          : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      borderColor:
                        isEq ? C.accent + "80"
                          : isOp ? C.accent + "40"
                          : C.cardBorder,
                    },
                  ]}
                >
                  <Text style={[
                    styles.kBtnTxt,
                    {
                      color: isEq ? "#fff" : isOp ? C.accent : isAct && btn.label === "AC" ? C.accentRed : C.text,
                      fontFamily: isOp || isEq ? "Inter_600SemiBold" : "Inter_500Medium",
                      fontSize: btn.label === "⌫" ? 20 : 22,
                    },
                  ]}>
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <LedgerModal visible={showLedger} onClose={() => setShowLedger(false)} onSave={addLedgerEntry} amount={Math.abs(numResult)} C={C} />
    </View>
  );
}

const BTN = 72;
const styles = StyleSheet.create({
  root: { flex: 1 },
  display: {
    flex: 1, paddingHorizontal: 24, justifyContent: "flex-end",
    alignItems: "flex-end", paddingBottom: 20, gap: 4,
  },
  exprTxt: { fontFamily: "Inter_400Regular", fontSize: 18, textAlign: "right" },
  resultTxt: { fontFamily: "Inter_700Bold", fontSize: 54, textAlign: "right", letterSpacing: -2, marginBottom: 10 },
  ledgerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  ledgerTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  keyboard: { paddingHorizontal: 14, gap: 10 },
  kRow: { flexDirection: "row", gap: 10, justifyContent: "space-between" },
  kBtn: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  kBtnWide: { flex: 1, width: undefined, borderRadius: BTN / 2, paddingLeft: 28, alignItems: "flex-start" },
  kBtnTxt: {},
});
