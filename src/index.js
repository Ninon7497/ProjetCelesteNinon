import chalk from "chalk";
import fs from "fs";
import path from "path";
import { startGame } from "./engine/game.js";
import { exportMarkdown } from "./engine/renderMarkdown.js";

const STORY_PATH = path.join(process.cwd(), "src", "data", "story.json");

console.clear();
console.log(chalk.blue.bold("\n🔎  Nuit de Pluie — Une enquête interactive\n"));

(async () => {
  try {
    // Lance le jeu et récupère l'état final
    const finalState = await startGame();

    // Si la partie a produit un état valable, on exporte le Markdown
    if (finalState && finalState.history && finalState.history.length) {
      const storyRaw = fs.readFileSync(STORY_PATH, "utf-8");
      const story = JSON.parse(storyRaw);

      const out = exportMarkdown(finalState, story);
      console.log(chalk.gray(`📄 Rapport exporté → ${out}\n`));
    } else {
      console.log(chalk.yellow("⚠️ Pas d'historique de partie, aucun rapport généré."));
    }
  } catch (err) {
    console.error("\n❌ Erreur fatale:", err);
    process.exit(1);
  }
})();
