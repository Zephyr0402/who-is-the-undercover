import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { t } from "../i18n";
import { colors } from "../theme";
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
      <Card style={styles.roleCard}>
        <Text style={styles.roleLabel}>{t(lang, "labelYourWord")}</Text>
        <Text style={styles.roleWord}>{myWord || "?"}</Text>
        <Text style={styles.roleHint}>{t(lang, "hintWaitingRole")}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t(lang, "titlePlayersAtTable")}</Text>
        <View>
          {room.players.map((player, index) => {
            const dimmed = player.is_voted_out;
            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  dimmed && styles.playerRowDimmed,
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
                  {canVote && !player.is_voted_out ? (
                    <AppButton
                      label={t(lang, "btnVoteOut")}
                      onPress={() => onVoteOut(player.id)}
                      variant="danger"
                      small
                    />
                  ) : null}
                </View>
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
  roleCard: {
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primary,
    paddingVertical: 28,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 10,
  },
  roleWord: {
    fontSize: 44,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  roleHint: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 14,
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
  playerRowDimmed: {
    opacity: 0.55,
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
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});
