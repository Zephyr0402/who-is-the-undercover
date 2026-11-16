import * as Clipboard from "expo-clipboard";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { t } from "../i18n";
import { colors } from "../theme";
import type { Lang, Room } from "../types";

interface LobbyScreenProps {
  lang: Lang;
  room: Room;
  playerId: string | null;
  notify: (message: string, kind?: "error" | "info") => void;
  onToggleReady: (isReady: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyScreen({
  lang,
  room,
  playerId,
  notify,
  onToggleReady,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  const me = room.players.find((player) => player.id === playerId);
  const isHost = room.host_id === playerId;
  const allReady = room.players.every((player) => player.is_ready);
  const enoughPlayers = room.players.length >= 3;
  const canStart =
    isHost && room.status === "waiting" && allReady && enoughPlayers;

  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(room.code);
      notify(t(lang, "toastCopied"), "info");
    } catch {
      notify(t(lang, "toastCopyFailed"));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <Text style={styles.cardTitle}>{t(lang, "titleRoomCode")}</Text>
        <View style={styles.codeRow}>
          <Text style={styles.roomCode}>{room.code}</Text>
          <AppButton
            label={t(lang, "btnCopy")}
            onPress={() => void copyCode()}
            variant="secondary"
            small
          />
        </View>
        <Text style={styles.hint}>{t(lang, "hintShareCode")}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t(lang, "titlePlayers")}</Text>
        <View>
          {room.players.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerRow,
                index === room.players.length - 1 && styles.playerRowLast,
              ]}
            >
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
                {player.id === playerId ? ` (${t(lang, "you")})` : ""}
              </Text>
              <View style={styles.playerMeta}>
                {player.is_host ? (
                  <Badge tone="host" label={t(lang, "badgeHost")} />
                ) : null}
                {player.is_ready ? (
                  <Badge tone="ready" label={t(lang, "badgeReady")} />
                ) : null}
                {!player.is_online ? (
                  <Badge tone="offline" label={t(lang, "badgeOffline")} />
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <AppButton
            label={t(lang, me?.is_ready ? "btnReadyOff" : "btnReadyOn")}
            onPress={() => onToggleReady(!me?.is_ready)}
            variant="secondary"
            style={styles.actionButton}
            disabled={room.status !== "waiting"}
          />
          {isHost ? (
            <AppButton
              label={t(lang, "btnStart")}
              onPress={onStart}
              style={styles.actionButton}
              disabled={!canStart}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <AppButton
            label={t(lang, "btnLeave")}
            onPress={onLeave}
            variant="danger"
            style={styles.actionButton}
          />
        </View>

        {!isHost ? (
          <Text style={styles.hint}>{t(lang, "hintWaiting")}</Text>
        ) : !canStart ? (
          <Text style={styles.hint}>{t(lang, "hintStart")}</Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 14,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  roomCode: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 6,
    color: colors.text,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    gap: 8,
  },
  playerRowLast: {
    borderBottomWidth: 0,
  },
  playerName: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
