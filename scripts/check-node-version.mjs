import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const supportedMajorVersions = new Set([22, 24]);
const currentVersion = process.versions.node;
const [majorString] = currentVersion.split(".");
const currentMajorVersion = Number(majorString);

if (!Number.isFinite(currentMajorVersion) || !supportedMajorVersions.has(currentMajorVersion)) {
  console.error(
    [
      `Unsupported Node.js version: ${currentVersion}.`,
      "Deebo Academy builds are supported on Node 22 or Node 24.",
      "Switch to a supported version before running npm run build.",
    ].join("\n"),
  );
  process.exit(1);
}

if (process.platform === "darwin" && existsSync("node_modules")) {
  // Fail fast when iCloud or Optimize Storage has offloaded dependency files.
  const datalessCheck = spawnSync("find", ["node_modules", "-flags", "+dataless", "-print", "-quit"], {
    encoding: "utf8",
  });

  const firstDatalessPath = datalessCheck.stdout.trim();

  if (datalessCheck.status === 0 && firstDatalessPath) {
    console.error(
      [
        "Build blocked by iCloud-offloaded dependency files.",
        `First offloaded file: ${firstDatalessPath}`,
        "This repo is under a macOS-managed folder and part of node_modules is marked dataless.",
        "Move the project out of iCloud-backed Documents/Desktop or download the folder locally before running npm run build.",
      ].join("\n"),
    );
    process.exit(1);
  }
}
