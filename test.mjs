import { spawn } from "node:child_process";

const child = spawn("node", ["./index.js"], { stdio: ["pipe", "pipe", "pipe"] });

let buf = "";
let passed = 0;

child.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  const lines = buf.split("\n");
  buf = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    if (msg.id === 1 && msg.result?.serverInfo?.name === "fatesense-mcp") {
      passed++;
      console.log("✅ initialize OK");
    }
    if (msg.id === 2 && Array.isArray(msg.result?.tools) && msg.result.tools.length === 5) {
      passed++;
      console.log("✅ tools/list OK:", msg.result.tools.map((t) => t.name).join(", "));
    }
    if (msg.id === 3) {
      const payload = JSON.parse(msg.result.content[0].text);
      if (payload.pillars?.day?.ganZhi === "壬午") {
        passed++;
        console.log("✅ calculate_bazi_chart OK (Lucia 2000-11-20 → 壬午)");
      } else {
        console.error("❌ Unexpected BaZi output:", payload);
        process.exit(1);
      }
      child.kill();
      if (passed === 3) {
        console.log("ALL MCP SMOKE TESTS PASSED!");
        process.exit(0);
      }
    }
  }
});

child.stderr.on("data", (d) => console.error("STDERR:", d.toString()));

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + "\n");
}

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke-test", version: "1.0.0" } },
});
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
send({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: { name: "calculate_bazi_chart", arguments: { birthDate: "2000-11-20", birthTime: "15:30", gender: "female" } },
});

setTimeout(() => {
  console.error("TIMEOUT waiting for MCP responses, passed =", passed);
  child.kill();
  process.exit(1);
}, 8000);
