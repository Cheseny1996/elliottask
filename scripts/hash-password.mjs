import bcrypt from "bcryptjs";
import { stdin, stdout, stderr } from "node:process";

function readHiddenPassword() {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal so the password can be hidden."));
      return;
    }

    let password = "";
    stdout.write("Admin password (input hidden): ");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", function onData(chunk) {
      const key = chunk.toString();
      if (key === "\u0003") {
        stdin.off("data", onData);
        stdin.setRawMode(false);
        stdout.write("\n");
        reject(new Error("Password setup cancelled."));
      } else if (key === "\r" || key === "\n") {
        stdin.off("data", onData);
        stdin.setRawMode(false);
        stdout.write("\n");
        resolve(password);
      } else if (key === "\u007f" || key === "\b") {
        password = password.slice(0, -1);
      } else if (!key.startsWith("\u001b")) {
        password += key;
      }
    });
  });
}

try {
  const password = await readHiddenPassword();
  if (password.length < 12) {
    console.error("Use an admin password with at least 12 characters.");
    process.exitCode = 1;
  } else {
    console.log(await bcrypt.hash(password, 12));
  }
} catch (error) {
  stderr.write(`${error instanceof Error ? error.message : "Password setup failed."}\n`);
  process.exitCode = 1;
}
