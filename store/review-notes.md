# App Review Notes — Who Is The Undercover

## What the app does

Who Is The Undercover is a social party word game for 3 or more players. Everyone in a room receives a secret word; most players receive the same word (civilians), while one or more players receive a similar but different word (the undercover). Players discuss out loud in the same room, then the host eliminates players one at a time until the undercover is found.

There are no accounts, logins, ads, subscriptions, or in-app purchases. The interface supports English and Simplified Chinese and can be switched from the first screen.

## How to test

The game requires **at least 3 players** (one device each).

1. On device A: type a nickname (any text) and tap **Create room**. A six-character room code appears.
2. On devices B and C: choose **Join room**, enter that code and a nickname.
3. Every player taps **I'm ready**; the host can then tap **Start game**.
4. Each device shows its secret word and the player list.
5. Players discuss verbally. The host taps **Vote out** next to a player to eliminate them; their role is revealed.
6. **New round** starts another round; **Leave room** exits.

A screen recording of a complete three-player round is available here:
**<ADD DEMO VIDEO URL BEFORE SUBMITTING>**


## Technical notes

- Backend: `https://www.bvshen.com/who-is-the-undercover` (HTTPS and WSS only).
- No user-generated public content: rooms are private and joined only with a shared six-character code. Nicknames are limited to 20 characters and are visible to anyone with the room code.
- No analytics, advertising, or tracking SDKs are included.
- Localization: English and Simplified Chinese.

## Contact

- Privacy policy: https://www.bvshen.com/who-is-the-undercover/privacy-policy/
