const path = require("path");

module.exports = {
  contracts_build_directory: path.join(__dirname, "frontend/src/abis"),
  networks: {
    development: {
      host: process.env.BLOCKCHAIN_HOST || "127.0.0.1", // Localhost (default: none)
      port: 8545,        // Standard Ethereum port (default: none)
      network_id: "*",   // Any network (default: none)
    },
  },

  compilers: {
    solc: {
      version: "^0.8.19", // Use Solidity version 0.8.x or higher
    }
  },
};
