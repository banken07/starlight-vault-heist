// main.ts — Starlight Vault entry point for make.fun (program/v1).
// Copies game/ and screenshots/ from this repository to /output and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Node standard library only; no network, no install step.
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = resolve(join(fileURLToPath(import.meta.url), ".."));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");
const gameDir = join(repoRoot, "game");
const shotsDir = join(repoRoot, "screenshots");

async function listImages(dir: string): Promise<string[]> {
  const names = await readdir(dir);
  return names
    .filter((n) => /\.(png|jpe?g)$/i.test(n) && !n.startsWith("."))
    .sort();
}

async function main(): Promise<void> {
  await mkdir(join(outDir, "game"), { recursive: true });
  await mkdir(join(outDir, "screenshots"), { recursive: true });
  await cp(gameDir, join(outDir, "game"), { recursive: true });
  await cp(shotsDir, join(outDir, "screenshots"), { recursive: true });

  const images = await listImages(join(outDir, "screenshots"));
  // buildDossier reads game/ and screenshots/ from the directory it is
  // given, so it runs against the copied output tree.
  const dossier = await buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 }
  });
  await writeFile(join(outDir, "dossier.json"), dossier, "utf8");
  // Verify the dossier we just wrote: it must parse and name every game
  // file, so a silent truncation can never pass as a good build.
  const written = JSON.parse(await readFile(join(outDir, "dossier.json"), "utf8")) as { text?: string };
  const expected = ["game/index.html", "game/game.js", "game/render.js", "game/rooms.js"];
  for (const name of expected) {
    if (!written.text || !written.text.includes(name)) {
      throw new Error("dossier.json is missing " + name);
    }
  }
  const bytes = Buffer.byteLength(dossier, "utf8");
  console.log("Starlight Vault: " + images.length + " screenshots, dossier " + bytes + " bytes -> " + outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
