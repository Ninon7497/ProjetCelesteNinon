import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { testSkill } from "./dice.js";
import { hasSave, saveGame, loadGame } from "./save.js";

const STORY_PATH = path.join(process.cwd(), "src", "data", "story.json");

// personnages prédéfinis
const CHARACTERS = [
  {
    name: "Inspectrice rationnelle",
    skills: { observation: 3, charisme: 1, intuition: 2 },
  },
  {
    name: "Jeune recrue",
    skills: { observation: 1, charisme: 3, intuition: 1 },
  },
  {
    name: "Détective privé",
    skills: { observation: 2, charisme: 2, intuition: 3 },
  },
];

function loadStory() {
  try {
    const raw = fs.readFileSync(STORY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(chalk.red(`❌ Impossible de lire ${STORY_PATH}`));
    process.exit(1);
  }
}

async function defineCharacter() {
  const { who } = await inquirer.prompt([
    {
      type: "list",
      name: "who",
      message: "🎭 Choisis ton personnage :",
      choices: CHARACTERS.map((c) => c.name),
    },
  ]);
  const player = CHARACTERS.find((c) => c.name === who);
  const sk = player.skills;
  console.log(chalk.green(`\nTu incarnes ${player.name}.`));
  console.log(
    chalk.cyan(
      `Compétences → Obs:${sk.observation}  Cha:${sk.charisme}  Int:${sk.intuition}\n`
    )
  );
  return player;
}

function visibleChoices(node) {
  const base = (node.choices || []).map((c, i) => ({
    name: `${i + 1}. ${c.label}`,
    value: c,
  }));
  if (!node.end)
    base.push({
      name: "💾 Sauvegarder et quitter",
      value: { _savequit: true },
    });
  return base;
}

export async function startGame() {
  const story = loadStory();

  // menu principal
  const menu = [
    { name: "🆕 Nouvelle enquête", value: "new" },
    ...(hasSave()
      ? [{ name: "📂 Reprendre la dernière enquête", value: "load" }]
      : []),
  ];
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Que veux-tu faire ?",
      choices: menu,
    },
  ]);

  let state;
  if (action === "load") {
    state = loadGame();
    if (!state) {
      console.log(chalk.red("❌ Sauvegarde illisible. Nouvelle partie."));
      state = null;
    } else {
      console.log(chalk.green("\n✅ Partie chargée.\n"));
    }
  }
  if (!state) {
    const player = await defineCharacter();
    state = {
      player,
      currentNodeKey: story.start,
      flags: { suspicion: 0 },
      stats: { stress: 0, clues: 0 },
      history: [],
    };
    saveGame(state);
  }

  // boucle de jeu
  while (true) {
    const node = story.nodes[state.currentNodeKey];
    if (!node) {
      console.log(chalk.red(`❌ Scène introuvable: ${state.currentNodeKey}`));
      break;
    }

    console.log(chalk.cyanBright("\n" + node.text + "\n"));

    
    state.history.push({
      scene: state.currentNodeKey,
      action: "Lecture",
      image: node.image ?? null,
    });

    if (node.end) {
      state.ending = node.end;
      console.log(chalk.green.bold("\n🕵️ Fin de l’enquête."));
      console.log(chalk.yellow(`Résultat : ${node.end.toUpperCase()}\n`));
      saveGame(state);
      break;
    }

    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: "Que faites-vous ?",
        choices: visibleChoices(node),
      },
    ]);

    if (choice._savequit) {
      saveGame(state);
      console.log(chalk.green(`\n💾 Sauvegardé. À bientôt !\n`));
      process.exit(0);
    }

    // test de compétence si requis
    if (choice.requiresRoll) {
      const skill = choice.requiresRoll.skill;
      const dc = Number(choice.requiresRoll.dc ?? 10);
      const bonus = state.player?.skills?.[skill] ?? 0;
      const { dice, total, success } = testSkill(bonus, dc);
      console.log(
        chalk.yellow(
          `🎲 Jet: d20=${dice} + ${skill}(${bonus}) = ${total}  → ${
            success ? "✅ RÉUSSITE" : "❌ ÉCHEC"
          }`
        )
      );

      if (!success) {
        state.history.push({
          scene: state.currentNodeKey,
          action: `Échec ${skill} (${total}/${dc})`,
          image: choice.image ?? node.image ?? null,
        });
        const failTo = choice.requiresRoll.failTo || node.failTo;
        if (failTo && story.nodes[failTo]) state.currentNodeKey = failTo;
        saveGame(state);
        continue;
      } else {
        state.history.push({
          scene: state.currentNodeKey,
          action: `Réussite ${skill} (${total}/${dc})`,
          image: choice.image ?? node.image ?? null,
        });
      }
    } else {
      state.history.push({
        scene: state.currentNodeKey,
        action: `Choix: ${choice.label}`,
        image: choice.image ?? node.image ?? null,
      });
    }

    state.currentNodeKey = choice.to;
    saveGame(state); 
    console.log(
      chalk.gray(`\n💾 Auto-sauvegarde mise à jour (src\\game.xml).`)
    );
  }

  console.log(chalk.gray("\nMerci d’avoir joué à 'Nuit de Pluie' !"));
  return state; 
}
