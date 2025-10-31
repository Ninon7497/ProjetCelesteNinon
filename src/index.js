import chalk from "chalk";
import { startGame } from "./engine/game.js";

console.clear();
console.log(chalk.blue.bold("\n🔎  Nuit de Pluie — Une enquête interactive\n"));

startGame().catch((err) => {
  console.error("\n❌ Erreur fatale:", err);
  process.exit(1);
});
