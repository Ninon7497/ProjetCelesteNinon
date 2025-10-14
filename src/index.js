import fs from "fs";
import inquirer from "inquirer";
import chalk from "chalk";
const storyPath = "./src/data/story.json";
let story;

try {
  const data = fs.readFileSync(storyPath, "utf-8");
  story = JSON.parse(data);
} catch (err) {
  console.error(chalk.red("❌ Erreur : impossible de lire story.json"));
  console.error(err.message);
  process.exit(1);
}
async function startGame() {
  console.clear();
  console.log(chalk.blue.bold("\n🔎  Nuit de Pluie — Une enquête interactive\n"));

  let currentNodeKey = story.start;
  let history = [];

  while (true) {
    const node = story.nodes[currentNodeKey];

    if (!node) {
      console.log(chalk.red(`❌ Erreur : la scène "${currentNodeKey}" est introuvable.`));
      break;
    }
    console.log(chalk.cyanBright("\n" + node.text + "\n"));
    history.push({
      scene: currentNodeKey,
      text: node.text,
    });
    if (node.end) {
      console.log(chalk.green.bold("\n🕵️ Fin de l’enquête."));
      console.log(chalk.yellow(`Résultat : ${node.end.toUpperCase()}\n`));
      break;
    }
    const choices = node.choices.map((choice, index) => ({
      name: `${index + 1}. ${choice.label}`,
      value: choice.to,
    }));
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "nextScene",
        message: "Que faites-vous ?",
        choices,
      },
    ]);
    currentNodeKey = answer.nextScene;
  }

  console.log(chalk.gray("\nMerci d’avoir joué à 'Nuit de Pluie' !"));
}

startGame();
