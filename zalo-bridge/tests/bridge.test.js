import assert from "assert";
import { config } from "../src/config.js";
import { zaloClient, MOCK_GROUPS } from "../src/zaloClient.js";

async function runTests() {
  console.log("--- Starting Zalo Bridge Unit Tests ---");

  // Test 1: Config
  console.log("Test 1: Verify Configuration");
  assert.strictEqual(typeof config.port, "number", "Port should be a number");
  assert.ok(config.backendUrl.includes("internal/zalo/messages"), "Backend URL should point to internal messages endpoint");
  assert.strictEqual(config.internalApiKey, "unisync_internal_secret_key_2026", "Internal API key should match backend");
  console.log("✓ Config test passed.");

  // Test 2: Client initialization in mock mode
  console.log("Test 2: ZaloClient Mock Mode Initialization");
  await zaloClient.init();
  assert.strictEqual(zaloClient.isConnected, true, "Client should be connected");
  const groups = zaloClient.getGroups();
  assert.ok(Array.isArray(groups), "Groups should be an array");
  assert.ok(groups.length >= MOCK_GROUPS.length, "Should have mock groups");
  console.log(`✓ Groups count: ${groups.length}`);
  console.log("✓ Client initialization test passed.");

  // Test 3: Status check
  console.log("Test 3: Status reporting");
  const status = zaloClient.getStatus();
  assert.strictEqual(status.connected, true);
  assert.ok(["mock", "real"].includes(status.mode), "Mode should be real or mock");
  assert.ok(status.groupCount > 0);
  console.log("✓ Status test passed:", JSON.stringify(status));

  console.log("\n=============================================");
  console.log("  ALL ZALO BRIDGE TESTS PASSED SUCCESSFULLY!  ");
  console.log("=============================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
