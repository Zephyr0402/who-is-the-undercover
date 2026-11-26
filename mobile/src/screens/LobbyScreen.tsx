import * as Clipboard from "expo-clipboard";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { t } from "../i18n";
import { colors, glass } from "../theme";
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
        <Text style={styles.eyebrow}>{t(lang, "titleRoomCode")}</Text>
        <Text style={styles.roomCode}>{room.code}</Text>
        <Text style={styles.hint}>{t(lang, "hintShareCode")}</Text>
        <AppButton
          label={t(lang, "btnCopy")}
          onPress={() => void copyCode()}
          variant="secondary"
          style={styles.copyButton}
        />
      </Card>

      <Card>
        <View style={styles.playersHeader}>
          <Text style={styles.cardTitle}>{t(lang, "titlePlayers")}</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{room.players.length}</Text>
          </View>
        </View>

        <View>
          {room.players.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerRow,
                index === room.players.length - 1 && styles.playerRowLast,
              ]}
            >
              <Avatar name={player.name} index={index} />
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
                {player.id === playerId ? (
                  <Text style={styles.youTag}> ({t(lang, "you")})</Text>
                ) : null}
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
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 8,
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
  copyButton: {
    marginTop: 14,
  },
  playersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
  },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: glass.borderSoft,
  },
  countText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.secondaryText,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: glass.hairline,
    gap: 12,
  },
  playerRowLast: {
    borderBottomWidth: 0,
  },
  playerName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  youTag: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
    maxWidth: "50%",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
  },
});
