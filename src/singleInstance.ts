import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";

export type InstanceLock = {
  release: () => void;
};

function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  if (pid === process.pid) return true;

  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

function readLockPid(path: string): number | null {
  try {
    const raw = readFileSync(path, "utf8").trim();
    const pid = Number.parseInt(raw, 10);
    return Number.isInteger(pid) ? pid : null;
  } catch {
    return null;
  }
}

export function acquireInstanceLock(path = "data/jobscout.lock"): InstanceLock | null {
  const lockPath = resolve(path);
  mkdirSync(dirname(lockPath), { recursive: true });

  const openLock = () => openSync(lockPath, "wx");
  let fd: number;

  try {
    fd = openLock();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;

    const pid = readLockPid(lockPath);
    if (pid !== null && isPidAlive(pid)) return null;

    rmSync(lockPath, { force: true });
    fd = openLock();
  }

  writeFileSync(fd, `${process.pid}\n`, "utf8");
  closeSync(fd);

  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      rmSync(lockPath, { force: true });
    },
  };
}

export async function assertPortAvailable(port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.once("listening", () => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    server.listen(port);
  });
}
