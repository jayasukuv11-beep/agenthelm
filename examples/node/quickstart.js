/* eslint-disable @typescript-eslint/no-require-imports */
const { AgentHelm } = require('../../sdk/node');

console.log("Testing AgentHelm Node SDK compatibility...");

const connectKey = "ahe_live_test_key";
const agent = new AgentHelm({
  key: connectKey,
  name: "Node Test Agent",
  autoPing: false
});

console.log(`Agent Name: ${agent.name}`);
agent.stop();
console.log("Node SDK Compatibility Test passed successfully!");
