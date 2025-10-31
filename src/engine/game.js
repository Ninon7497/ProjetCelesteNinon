import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { create, convert } from "xmlbuilder2";

// ----- chemins (story.json à côté de index.js ; game.xml écrit dans src/) -----
const STORY_PATH = path.join(process.cwd(), "src", "data",  "story.json");
const SAVE_PATH  = path.join(process.cwd(), "src", "game.xml");

// ----- utils dés -----
function rollDice(faces = 20) {
  return Math.floor(Math.random() * faces) + 1;
}
function testSkill(bonus = 0, dc = 10) {
  const d = rollDice(20);
  const total = d + (bonus || 0);
  return { dice: d, total, dc, success: total >= dc };
}

// ----- personnages prédéfinis -----
const CHARACTERS = [
  { name: "Inspectrice rationnelle", skills: { observation: 3, charisme: 1, intuition: 2 } },
  { name: "Jeune recrue",           skills: { observation: 1, charisme: 3, intuition: 1 } },
  { name: "Détective privé",        skills: { observation: 2, charisme: 2, intuition: 3 } }
];

// ----- sauvegarde / reprise (XML) -----
function hasSave() {
  return fs.existsSync(SAVE_PATH);
}
function saveGame(state) {
  const obj = {
    save: {
      player: {
        "@name": state.player?.name ?? "",
        skills: {
          "@observation": state.player?.skills?.observation ?? 0,
          "@charisme":    state.player?.skills?.charisme ?? 0,
          "@intuition":   state.player?.skills?.intuition ?? 0
        }
      },
      progress: {
        "@currentNode": state.currentNodeKey ?? "",
        flags: Object.fromEntries(Object.entries(state.flags || {}).map(([k, v]) => ["@" + k, String(v)])),
        stats: Object.fromEntries(Object.entries(state.stats || {}).map(([k, v]) => ["@" + k, String(v)])),
        log: {
          entry: (state.history || []).map(e => ({ "#": `${e.scene} :: ${e.action}` }))
        }
      }
    }
  };
  const xml = create(obj).end({ prettyPrint: true });
  fs.writeFileSync(SAVE_PATH, xml, "utf-8");
}
function loadGame() {
  try {
    const xml = fs.readFileSync(SAVE_PATH, "utf-8");
    const obj = convert(xml, { format: "object" });
    const p = obj?.save?.player || {};
    const sk = p?.skills || {};
    const prog = obj?.save?.progress || {};

    const state = {
      player: {
        name: p["@name"] || "Agent",
        skills: {
          observation: Number(sk["@observation"] ?? 0),
          charisme:    Number(sk["@charisme"] ?? 0),
          intuition:   Number(sk["@intuition"] ?? 0)
        }
      },
      currentNodeKey: prog["@currentNode"] || "",
      flags: {},
      stats: {},
      history: []
    };

    for (const [k, v] of Object.entries(prog.flags || {})) if (k.startsWith("@")) state.flags[k.slice(1)] = num(v);
    for (const [k, v] of Object.entries(prog.stats || {})) if (k.startsWith("@")) state.stats[k.slice(1)] = num(v);

    const entries = prog.log?.entry || [];
    const arr = Array.isArray(entries) ? entries : [entries];
    state.history = arr.filter(Boolean).map(e => {
      const [scene, action] = String(e["#"] || "").split(" :: ");
      return { scene, action };
    });

    return state;
  } catch {
    return null;
  }
}
function num(v) { const n = Number(v); return Number.isNaN(n) ? v : n; }

// ----- story loader -----
function loadStory() {
  try {
    const raw = fs.readFileSync(STORY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(chalk.red(`❌ Impossible de lire ${STORY_PATH}`));
    process.exit(1);
  }
}

// ----- helpers UI -----
async function defineCharacter() {
  const { who } = await inquirer.prompt([
    { type: "list", name: "who", message: "🎭 Choisis ton personnage :", choices: CHARACTERS.map(c => c.name) }
  ]);
  const player = CHARACTERS.find(c => c.name === who);
  const sk = player.skills;
  console.log(chalk.green(`\nTu incarnes ${player.name}.`));
  console.log(chalk.cyan(`Compétences → Obs:${sk.observation}  Cha:${sk.charisme}  Int:${sk.intuition}\n`));
  return player;
}
function visibleChoices(node) {
  const base = (node.choices || []).map((c, i) => ({ name: `${i + 1}. ${c.label}`, value: c }));
  if (!node.end) base.push({ name: "💾 Sauvegarder et quitter", value: { _savequit: true } });
  return base;
}

// ----- boucle principale -----
export async function startGame() {
  const story = loadStory();

  // Menu de départ
  const menu = [
    { name: "🆕 Nouvelle enquête", value: "new" },
    ...(hasSave() ? [{ name: "📂 Reprendre la dernière enquête", value: "load" }] : [])
  ];
  const { action } = await inquirer.prompt([{ type: "list", name: "action", message: "Que veux-tu faire ?", choices: menu }]);

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
    state = { player, currentNodeKey: story.start, flags: { suspicion: 0 }, stats: { stress: 0, clues: 0 }, history: [] };
    saveGame(state);
  }

  // Gameplay loop
  while (true) {
    const node = story.nodes[state.currentNodeKey];
    if (!node) { console.log(chalk.red(`❌ Scène introuvable: ${state.currentNodeKey}`)); break; }

    console.log(chalk.cyanBright("\n" + node.text + "\n"));
    state.history.push({ scene: state.currentNodeKey, action: "Lecture" });

    if (node.end) {
      state.ending = node.end;
      console.log(chalk.green.bold("\n🕵️ Fin de l’enquête."));
      console.log(chalk.yellow(`Résultat : ${node.end.toUpperCase()}\n`));
      saveGame(state); // sauvegarde finale
      break;
    }

    const { choice } = await inquirer.prompt([
      { type: "list", name: "choice", message: "Que faites-vous ?", choices: visibleChoices(node) }
    ]);

    if (choice._savequit) {
      saveGame(state);
      console.log(chalk.green(`\n💾 Sauvegardé. À bientôt !\n`));
      process.exit(0);
    }

    // test de compétence si requis par le JSON
    if (choice.requiresRoll) {
      const skill = choice.requiresRoll.skill;
      const dc = Number(choice.requiresRoll.dc ?? 10);
      const bonus = state.player?.skills?.[skill] ?? 0;
      const { dice, total, success } = testSkill(bonus, dc);
      console.log(chalk.yellow(`🎲 Jet: d20=${dice} + ${skill}(${bonus}) = ${total}  → ${success ? "✅ RÉUSSITE" : "❌ ÉCHEC"}`));

      if (!success) {
        state.history.push({ scene: state.currentNodeKey, action: `Échec ${skill} (${total}/${dc})` });
        const failTo = choice.requiresRoll.failTo || node.failTo;
        if (failTo && story.nodes[failTo]) {
          state.currentNodeKey = failTo;
        }
        saveGame(state);
        continue; // relire la prochaine scène
      } else {
        state.history.push({ scene: state.currentNodeKey, action: `Réussite ${skill} (${total}/${dc})` });
      }
    } else {
      state.history.push({ scene: state.currentNodeKey, action: `Choix: ${choice.label}` });
    }

    state.currentNodeKey = choice.to;
    saveGame(state); // auto-save après chaque transition
    console.log(chalk.gray(`\n💾 Auto-sauvegarde mise à jour (src\\game.xml).`));
  }

  console.log(chalk.gray("\nMerci d’avoir joué à 'Nuit de Pluie' !"));
}
