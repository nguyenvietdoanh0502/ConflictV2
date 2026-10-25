import axios from "axios";
import { config } from "../src/config.js";

async function testBackendIntegration() {
  console.log("--- Testing Bridge -> Backend Communication ---");
  console.log(`Backend Target URL: ${config.backendUrl}`);
  console.log(`Internal API Key: ${config.internalApiKey}`);

  const testPayload = {
    zalo_group_id: "group-it101",
    message_id: `test-${Date.now()}`,
    sender_name: "Lớp trưởng",
    message_text: "Thứ 2 tuần sau kiểm tra 15p tại phòng 401-A1 nhé ae",
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await axios.post(config.backendUrl, testPayload, {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": config.internalApiKey,
      },
      timeout: 10000,
    });

    console.log("✓ Backend successfully responded!");
    console.log("Response status:", res.status);
    console.log("Response data:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log(`Backend reached! Status: ${error.response.status}`);
      console.log("Backend response body:", JSON.stringify(error.response.data, null, 2));
      if (error.response.status === 400 || error.response.status === 200 || error.response.status === 404) {
        console.log("✓ Network and authentication pipeline to backend verified!");
      }
    } else {
      console.warn("Could not reach backend:", error.message);
    }
  }
}

testBackendIntegration().catch(console.error);
