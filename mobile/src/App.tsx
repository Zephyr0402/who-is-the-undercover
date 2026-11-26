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

import { AuroraBackground } from "./components/AuroraBackground";
import { GlassSurface } from "./components/GlassSurface";
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
      <AuroraBackground />
      <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.container}>
          <GlassSurface
            radius={24}
            intensity={35}
            tintColor="rgba(255, 255, 255, 0.42)"
            style={styles.header}
            contentStyle={styles.headerContent}
          >
            <Text style={styles.title}>🕵️ {t(game.lang, "appTitle")}</Text>
            <Text style={styles.subtitle}>{t(game.lang, "appSubtitle")}</Text>
          </GlassSurface>

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
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  header: {
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "400",
    color: colors.muted,
    textAlign: "center",
  },
});
