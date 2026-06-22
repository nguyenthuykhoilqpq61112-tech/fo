import { Fixture, Team, Player, MatchEvent } from "../types";

const cardCommentaries = [
  "arrives late with a reckless challenge. Yellow card.",
  "pulls down the attacker to halt a dangerous counter-attack. A tactical yellow.",
  "engages in a heated argument with the referee, resulting in a yellow card.",
  "cynical challenge from the defender. Deserved yellow.",
  "doesn't get the ball at all — that's a booking.",
  "raises his hands — the referee has no choice.",
  "referee reaches for the book — cautioned.",
  "book him ref! And he does. Walking a tightrope now."
];

const redCommentaries = [
  "commits an incredibly dangerous two-footed tackle! RED CARD! Absolute disaster!",
  "commits a professional foul as the last man. Direct RED CARD! He is walking off!",
  "lashes out violently! That's a straight red! Unbelievable scenes!",
  "a shocking challenge! The referee didn't hesitate. RED CARD!",
  "receives a second yellow card! He's off! His manager is furious.",
  "what was he thinking? A moment of madness and he sees red!",
  "denies a clear goalscoring opportunity. It has to be red.",
  "the tension boils over! It's a second bookable offence, he's sent off!"
];

const foulCommentaries = [
  "trips the opponent in midfield. Free kick awarded.",
  "pushes off the defender. Foul called.",
  "goes in a bit too strong in a 50/50 challenge. Play is stopped.",
  "slips and caught the opponent's ankle. Warning from the referee.",
  "clatters into the back of the attacker. Foul given.",
  "late tackle. The referee gives a free kick but keeps his cards away.",
  "a bit too aggressive in the air. The whistle blows.",
  "guilty of a shirt pull. Free kick."
];

const freeKickCommentaries = [
  "A foul right on the edge of the box! This is a very dangerous free kick.",
  "Hacked down just outside the penalty area. Great scoring opportunity here.",
  "The referee awards a free kick in a brilliant position. The wall is setting up.",
  "A crucial free kick is given just yards away from the D.",
  "He's brought down in the attacking third! The team has a set-piece chance."
];

export function processFouls(
  fixture: Fixture,
  defendingSide: "home" | "away",
  defendingTeam: Team,
  defendingActiveOnField: Player[],
  matchMinute: number,
  weatherModifiers: any
) {
  // 22% chance per tick to generate a foul
  let baseFoulRate = 0.22;
  
  if (weatherModifiers) {
    baseFoulRate *= weatherModifiers.foulRateMultiplier;
  }

  if (Math.random() < baseFoulRate) {
    const defenderPlayers = defendingActiveOnField.filter(p => p.position !== "GK");
    if (defenderPlayers.length === 0) return;

    const offendingPlayer = defenderPlayers[Math.floor(Math.random() * defenderPlayers.length)];
    const cardTracker = fixture.cardTrackers?.find(c => c.playerId === offendingPlayer.id) || {
      playerId: offendingPlayer.id,
      playerName: offendingPlayer.name,
      clubId: defendingTeam.id,
      yellowCount: 0,
      isRedCarded: false
    };

    if (!fixture.cardTrackers?.find(c => c.playerId === offendingPlayer.id)) {
      fixture.cardTrackers = fixture.cardTrackers || [];
      fixture.cardTrackers.push(cardTracker);
    }

    let yellowProb = 0.14;
    let redProb = 0.012;

    if (weatherModifiers) {
      yellowProb *= weatherModifiers.yellowCardMultiplier;
      // Red card probabilities are also influenced slightly by volatility
      redProb *= weatherModifiers.volatilityMultiplier;
    }

    const rand = Math.random();

    fixture.stats[defendingSide].fouls += 1;

    if (rand < redProb) {
      // Straight Red
      cardTracker.isRedCarded = true;
      fixture.stats[defendingSide].redCards += 1;
      const commentaryTemplate = redCommentaries[Math.floor(Math.random() * redCommentaries.length)];
      
      fixture.events.push({
        minute: matchMinute,
        type: "RED_CARD",
        teamId: defendingTeam.id,
        playerId: offendingPlayer.id,
        playerName: offendingPlayer.name,
        commentary: `🟥 RED CARD! ${offendingPlayer.name} ${commentaryTemplate}`
      });
    } else if (rand < redProb + yellowProb) {
      // Yellow Card
      cardTracker.yellowCount += 1;
      fixture.stats[defendingSide].yellowCards += 1;
      
      if (cardTracker.yellowCount >= 2) {
        cardTracker.isRedCarded = true;
        fixture.stats[defendingSide].redCards += 1;
        const commentaryTemplate = redCommentaries[Math.floor(Math.random() * redCommentaries.length)];
        
        fixture.events.push({
          minute: matchMinute,
          type: "RED_CARD",
          teamId: defendingTeam.id,
          playerId: offendingPlayer.id,
          playerName: offendingPlayer.name,
          commentary: `🟥 SECOND YELLOW! ${offendingPlayer.name} ${commentaryTemplate}`
        });
      } else {
        const commentaryTemplate = cardCommentaries[Math.floor(Math.random() * cardCommentaries.length)];
        fixture.events.push({
          minute: matchMinute,
          type: "YELLOW_CARD",
          teamId: defendingTeam.id,
          playerId: offendingPlayer.id,
          playerName: offendingPlayer.name,
          commentary: `🟨 Yellow Card. ${offendingPlayer.name} ${commentaryTemplate}`
        });
      }
    } else {
      // Regular foul
      const commentaryTemplate = foulCommentaries[Math.floor(Math.random() * foulCommentaries.length)];
      fixture.events.push({
        minute: matchMinute,
        type: "FOUL",
        commentary: `⚠️ Foul. ${offendingPlayer.name} ${commentaryTemplate}`
      });

      // 35% chance to generate a free kick near penalty area
      if (Math.random() < 0.35) {
        const fkCommentary = freeKickCommentaries[Math.floor(Math.random() * freeKickCommentaries.length)];
        fixture.events.push({
          minute: matchMinute,
          type: "COMMENTARY",
          commentary: `🎯 ${fkCommentary}`
        });
      }
    }
  }
}
