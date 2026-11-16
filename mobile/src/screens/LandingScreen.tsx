import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { t } from "../i18n";
import { colors, radius } from "../theme";
import type { Lang } from "../types";
import { sanitizeCode } from "../useUndercover";

type Tab = "create" | "join";

interface LandingScreenProps {
  lang: Lang;
  changeLang: (lang: Lang) => void;
  createRoom: (name: string) => Promise<boolean>;
  joinRoom: (code: string, name: string) => Promise<boolean>;
}

export function LandingScreen({
  lang,
  changeLang,
  createRoom,
  joinRoom,
}: LandingScreenProps) {
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submitCreate = async () => {
    setBusy(true);
    try {
      await createRoom(name);
    } finally {
      setBusy(false);
    }
  };

  const submitJoin = async () => {
    setBusy(true);
    try {
      await joinRoom(code, name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <View style={styles.langRow}>
          {(["en", "zh"] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: lang === option }}
              onPress={() => changeLang(option)}
              style={[styles.langButton, lang === option && styles.langButtonActive]}
            >
              <Text
                style={[styles.langText, lang === option && styles.langTextActive]}
              >
                {option === "en" ? t(lang, "langEn") : t(lang, "langZh")}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "create" }}
            onPress={() => setTab("create")}
            style={[styles.tab, tab === "create" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "create" && styles.tabTextActive]}>
              {t(lang, "tabCreate")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "join" }}
            onPress={() => setTab("join")}
            style={[styles.tab, tab === "join" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "join" && styles.tabTextActive]}>
              {t(lang, "tabJoin")}
            </Text>
          </Pressable>
        </View>

        {tab === "create" ? (
          <View>
            <TextField
              label={t(lang, "labelName")}
              placeholder={t(lang, "placeholderName")}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoCorrect={false}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={() => void submitCreate()}
            />
            <AppButton
              label={t(lang, "btnCreate")}
              onPress={() => void submitCreate()}
              loading={busy}
            />
          </View>
        ) : (
          <View>
            <TextField
              label={t(lang, "labelCode")}
              placeholder={t(lang, "placeholderCode")}
              value={code}
              onChangeText={(value) => setCode(sanitizeCode(value))}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              editable={!busy}
              returnKeyType="next"
            />
            <TextField
              label={t(lang, "labelName")}
              placeholder={t(lang, "placeholderCodeName")}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoCorrect={false}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={() => void submitJoin()}
            />
            <AppButton
              label={t(lang, "btnJoin")}
              onPress={() => void submitJoin()}
              loading={busy}
            />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  langButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.card,
  },
  langButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  langText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
  },
  langTextActive: {
    color: colors.primary,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  tabTextActive: {
    color: colors.white,
  },
});
