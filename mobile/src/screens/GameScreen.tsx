import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { t } from "../i18n";
import { colors, glass } from "../theme";
import type { Lang, Room } from "../types";

interface GameScreenProps {
  lang: Lang;
  room: Room;
  playerId: string | null;
  myWord: string | null;
  onNewRound: () => void;
  onVoteOut: (targetId: string) => void;
  onLeave: () => void;
}

export function GameScreen({
  lang,
  room,
  playerId,
  myWord,
  onNewRound,
  onVoteOut,
  onLeave,
}: GameScreenProps) {
  const isHost = room.host_id === playerId;
  const canVote = isHost && room.status === "playing";

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card contentStyle={styles.roleContent}>
        <View style={styles.rolePill}>
          <Text style={styles.roleLabel}>{t(lang, "labelYourWord")}</Text>
        </View>
        <Text style={styles.roleWord}>{myWord || "?"}</Text>
        <Text style={styles.roleHint}>{t(lang, "hintWaitingRole")}</Text>
      </Card>

      <Card>
        <View style={styles.playersHeader}>
          <Text style={styles.cardTitle}>{t(lang, "titlePlayersAtTable")}</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{room.players.length}</Text>
          </View>
        </View>

        <View>
          {room.players.map((player, index) => {
            const dimmed = player.is_voted_out;
            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  index === room.players.length - 1 && styles.playerRowLast,
                ]}
              >
                <Avatar name={player.name} index={index} dimmed={dimmed} />
                <View style={[styles.playerInfo, dimmed && styles.playerDimmed]}>
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
                    {!player.is_online ? (
                      <Badge tone="offline" label={t(lang, "badgeOffline")} />
                    ) : null}
                    {player.is_voted_out ? (
                      <>
                        <Badge tone="votedOut" label={t(lang, "badgeVotedOut")} />
                        <Badge
                          tone="revealed"
                          label={t(
                            lang,
                            player.role === "undercover"
                              ? "badgeRevealedUndercover"
                              : "badgeRevealedCivilian"
                          )}
                        />
                      </>
                    ) : null}
                  </View>
                </View>
                {canVote && !player.is_voted_out ? (
                  <AppButton
                    label={t(lang, "btnVoteOut")}
                    onPress={() => onVoteOut(player.id)}
                    variant="danger"
                    small
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.actions}>
        {isHost ? (
          <AppButton
            label={t(lang, "btnNewRound")}
            onPress={onNewRound}
            style={styles.actionButton}
          />
        ) : null}
        <AppButton
          label={t(lang, "btnLeave")}
          onPress={onLeave}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  roleContent: {
    alignItems: "center",
    paddingVertical: 28,
  },
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.primarySoft,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.primary,
  },
  roleWord: {
    fontSize: 44,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  roleHint: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 21,
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
  playerInfo: {
    flex: 1,
    gap: 5,
  },
  playerDimmed: {
    opacity: 0.55,
  },
  playerName: {
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
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});
