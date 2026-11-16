import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import { ToastBanner } from "./components/ToastBanner";
import { t } from "./i18n";
import { GameScreen } from "./screens/GameScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { colors } from "./theme";
import { useUndercover } from "./useUndercover";

function Root() {
  const game = useUndercover();
  const { room } = game;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🕵️ {t(game.lang, "appTitle")}</Text>
            <Text style={styles.subtitle}>{t(game.lang, "appSubtitle")}</Text>
          </View>

          {room ? (
            room.status === "waiting" ? (
              <LobbyScreen
                lang={game.lang}
                room={room}
                playerId={game.playerId}
                notify={game.notify}
                onToggleReady={game.setReady}
                onStart={game.startGame}
                onLeave={game.leaveRoom}
              />
            ) : (
              <GameScreen
                lang={game.lang}
                room={room}
                playerId={game.playerId}
                myWord={game.myWord}
                onNewRound={game.newRound}
                onVoteOut={game.voteOut}
                onLeave={game.leaveRoom}
              />
            )
          ) : (
            <LandingScreen
              lang={game.lang}
              changeLang={game.changeLang}
              createRoom={game.createRoom}
              joinRoom={game.joinRoom}
            />
          )}
        </View>

        <ToastBanner toast={game.toast} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
});
