import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { t } from "../i18n";
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
      <View style={styles.langRow}>
        <SegmentedControl
          compact
          options={[
            { value: "en" as const, label: t(lang, "langEn") },
            { value: "zh" as const, label: t(lang, "langZh") },
          ]}
          value={lang}
          onChange={changeLang}
          style={styles.langControl}
        />
      </View>

      <Card>
        <SegmentedControl
          options={[
            { value: "create" as const, label: t(lang, "tabCreate") },
            { value: "join" as const, label: t(lang, "tabJoin") },
          ]}
          value={tab}
          onChange={setTab}
          style={styles.tabs}
        />

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
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  langControl: {
    width: 148,
  },
  tabs: {
    marginBottom: 18,
  },
});
