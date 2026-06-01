import { spawn } from "child_process";

export function runCommand(
  cmd: string,
  args: string[],
  timeoutMs = 60_000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PATH: [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        process.env["PATH"] ?? "/usr/bin:/bin",
      ].join(":"),
    };
    const proc = spawn(cmd, args, { stdio: "pipe", env });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`));
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${cmd} exited with code ${code}. stderr: ${stderr}`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
