
import fs from "fs";
import path from "path";
import { create, convert } from "xmlbuilder2";

const SAVE_PATH = path.join(process.cwd(), "src", "game.xml");

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function hasSave() {
  return fs.existsSync(SAVE_PATH);
}

export function saveGame(state) {
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
  ensureDirFor(SAVE_PATH);
  fs.writeFileSync(SAVE_PATH, xml, "utf-8");
}

export function loadGame() {
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

    for (const [k, v] of Object.entries(prog.flags || {})) if (k.startsWith("@")) state.flags[k.slice(1)] = numberOrString(v);
    for (const [k, v] of Object.entries(prog.stats || {})) if (k.startsWith("@")) state.stats[k.slice(1)] = numberOrString(v);

    // log
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

function numberOrString(v) {
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}
