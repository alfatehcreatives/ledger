import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, useColorScheme, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, Memo } from "@/context/AppContext";

const TAG_COLORS: Record<string, string> = {
  personal: "#A78BFA",
  work: "#4F8EF7",
  ideas: "#34D399",
  important: "#F87171",
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MemoCard({ memo, onPress, onLongPress, C }: {
  memo: Memo; onPress: () => void; onLongPress: () => void; C: typeof Colors.dark;
}) {
  const preview = memo.content.replace(/\n+/g, " ").trim().slice(0, 90);
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: C.card, borderColor: C.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {memo.pinned && (
        <View style={[styles.pinDot, { backgroundColor: C.accentGold }]} />
      )}
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
          {memo.title || "Untitled"}
        </Text>
        <Text style={[styles.cardDate, { color: C.textMuted }]}>{formatDate(memo.updatedAt)}</Text>
      </View>
      {preview.length > 0 && (
        <Text style={[styles.cardPreview, { color: C.textSecondary }]} numberOfLines={2}>
          {preview}
        </Text>
      )}
      {memo.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {memo.tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: TAG_COLORS[tag] + "20", borderColor: TAG_COLORS[tag] + "40" }]}>
              <Text style={[styles.tagTxt, { color: TAG_COLORS[tag] }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function MemosScreen() {
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { memos, addMemo, deleteMemo } = useApp();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q ? memos.filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)) : memos;
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [memos, search]);

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const m = addMemo({ title: "", content: "", tags: [], pinned: false });
    router.push({ pathname: "/memo/[id]", params: { id: m.id, isNew: "true" } });
  };

  const handleLongPress = (m: Memo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Memo", `Delete "${m.title || "Untitled"}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMemo(m.id) },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View>
          <Text style={[styles.screenTitle, { color: C.text }]}>Memos</Text>
          <Text style={[styles.screenCount, { color: C.textMuted }]}>{memos.length} note{memos.length !== 1 ? "s" : ""}</Text>
        </View>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: C.glass, borderColor: C.glassBorder }]}>
        <Ionicons name="search-outline" size={15} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder="Search memos..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={15} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 90, gap: 10 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyH, { color: C.textSecondary }]}>{search ? "No results" : "No memos yet"}</Text>
            <Text style={[styles.emptyP, { color: C.textMuted }]}>{search ? "Try different keywords" : "Tap + to write something"}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MemoCard memo={item} onPress={() => router.push({ pathname: "/memo/[id]", params: { id: item.id } })} onLongPress={() => handleLongPress(item)} C={C} />
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
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  screenTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  screenCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 9,
    marginHorizontal: 16, marginBottom: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, overflow: "hidden" },
  pinDot: { position: "absolute", top: 14, right: 14, width: 7, height: 7, borderRadius: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1, marginRight: 8 },
  cardDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardPreview: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  tagTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },
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
