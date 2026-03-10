import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  useColorScheme, ScrollView, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, MemoTag } from "@/context/AppContext";

const TAG_OPTIONS: { label: string; value: MemoTag; color: string }[] = [
  { label: "Personal", value: "personal", color: "#A78BFA" },
  { label: "Work", value: "work", color: "#4F8EF7" },
  { label: "Ideas", value: "ideas", color: "#34D399" },
  { label: "Important", value: "important", color: "#F87171" },
];

export default function MemoEditor() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const isDark = useColorScheme() !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { memos, updateMemo, deleteMemo } = useApp();

  const memo = memos.find(m => m.id === id);
  const [title, setTitle] = useState(memo?.title ?? "");
  const [content, setContent] = useState(memo?.content ?? "");
  const [tags, setTags] = useState<MemoTag[]>(memo?.tags ?? []);
  const [pinned, setPinned] = useState(memo?.pinned ?? false);
  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isNew === "true") setTimeout(() => contentRef.current?.focus(), 400);
  }, [isNew]);

  const save = () => { if (id) updateMemo(id, { title, content, tags, pinned }); };

  const handleBack = () => {
    if (!title.trim() && !content.trim()) deleteMemo(id!);
    else save();
    router.back();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Memo", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteMemo(id!); router.back(); } },
    ]);
  };

  const toggleTag = (tag: MemoTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={handleBack} style={styles.hBtn}>
          <Ionicons name="chevron-down" size={24} color={C.text} />
        </Pressable>
        <View style={styles.hActions}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPinned(p => !p); }} style={styles.hBtn}>
            <Ionicons name={pinned ? "pin" : "pin-outline"} size={20} color={pinned ? C.accentGold : C.textSecondary} />
          </Pressable>
          <Pressable onPress={() => { save(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.hBtn}>
            <Ionicons name="checkmark-circle" size={22} color={C.accent} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.hBtn}>
            <Ionicons name="trash-outline" size={19} color={C.accentRed} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} keyboardDismissMode="interactive" contentContainerStyle={{ paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.titleInput, { color: C.text }]}
          placeholder="Title"
          placeholderTextColor={C.textMuted}
          value={title} onChangeText={setTitle}
          multiline blurOnSubmit={false}
          onSubmitEditing={() => contentRef.current?.focus()}
        />
        <TextInput
          ref={contentRef}
          style={[styles.contentInput, { color: C.text }]}
          placeholder="Start writing..."
          placeholderTextColor={C.textMuted}
          value={content} onChangeText={setContent}
          multiline textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: botPad + 8, borderTopColor: C.cardBorder, backgroundColor: C.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TAG_OPTIONS.map(tag => {
            const active = tags.includes(tag.value);
            return (
              <Pressable key={tag.value} onPress={() => toggleTag(tag.value)}
                style={[styles.tagChip, { backgroundColor: active ? tag.color + "22" : C.glass, borderColor: active ? tag.color : C.glassBorder }]}>
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={[styles.tagTxt, { color: active ? tag.color : C.textMuted }]}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[styles.statsTxt, { color: C.textMuted }]}>{words} words · {content.length} chars</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8 },
  hBtn: { padding: 8 },
  hActions: { flexDirection: "row", gap: 2 },
  titleInput: { fontFamily: "Inter_700Bold", fontSize: 28, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, letterSpacing: -0.5, lineHeight: 36 },
  contentInput: { fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 27, paddingHorizontal: 20, minHeight: 300 },
  footer: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  tagTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  statsTxt: { fontFamily: "Inter_400Regular", fontSize: 12, paddingHorizontal: 20, paddingBottom: 4 },
});
