import fs from "fs";
import path from "path";

export function exportMarkdown(state, story, options = {}) {
  const title = options.title ?? "Rapport d’enquête — Nuit de Pluie";
  const outDir = options.outDir ?? path.join(process.cwd(), "src", "export");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const safeName = String(state.player?.name || "Agent").replace(/[^\w\-]+/g, "_");
  const outPath = path.join(outDir, `rapport-${safeName}-${stamp}.md`);

  const nodes = story?.nodes || {};
  const skills = state.player?.skills || {};

  function relImage(imgPath) {
    if (!imgPath) return null;
    const clean = String(imgPath).replace(/\\/g, "/");
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("data/")) return `../${clean}`;     
    if (clean.startsWith("images/")) return `../data/${clean}`;
    return `../data/images/${clean}`;
  }

  const lines = [];
  lines.push(`# ${title}`);
  lines.push(`*Généré le ${new Date().toLocaleString()}*`);
  lines.push("");
  lines.push("## Profil");
  lines.push(`- **Nom** : ${state.player?.name || "Agent"}`);
  lines.push(`- **Compétences** : Observation ${skills.observation ?? 0} | Charisme ${skills.charisme ?? 0} | Intuition ${skills.intuition ?? 0}`);
  lines.push("");

  lines.push("## Récit de l’enquête");
  lines.push("");

  const hist = Array.isArray(state.history) ? state.history : [];

  for (let i = 0; i < hist.length; i++) {
    const entry = hist[i];
    if (entry.action !== "Lecture") continue; 

    const nodeKey = entry.scene;
    const node = nodes[nodeKey] || {};
    const sceneImg = relImage(entry.image || node.image);

    // Titre de la scène
    lines.push(`### ${nodeKey}`);
    if (sceneImg) lines.push(`![Illustration](${sceneImg})`);
    lines.push("");
    if (node.text) lines.push(node.text, "");

    // Regrouper les actions jusqu'à la prochaine "Lecture"
    const actions = [];
    let j = i + 1;
    while (j < hist.length && hist[j].action !== "Lecture") {
      actions.push(hist[j]);
      j++;
    }

    if (actions.length) {
      lines.push("**Actions :**");
      for (const a of actions) {
        lines.push(`- ${a.action}`);
        const actionImg = relImage(a.image);
        if (actionImg && actionImg !== sceneImg) {
          lines.push(``);
          lines.push(`![Illustration](${actionImg})`);
        }
      }
      lines.push("");
    }
    i = j - 1;
  }

  lines.push("## Verdict");
  lines.push(state.ending ? `**${String(state.ending).toUpperCase()}**` : `_Partie non terminée_`);
  lines.push("");

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  return outPath;
}
