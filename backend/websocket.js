const WebSocket = require("ws");

// Thêm host: "0.0.0.0" để cho phép truy cập từ mọi IP
const wss = new WebSocket.Server({ host: "0.0.0.0", port: 8080 });
console.log("WebSocket Server Started on ws://0.0.0.0:8080");

const users = new Set();
wss.on("connection", (ws) => {
    console.log("Socket Connected!");
    users.add(ws);

    ws.on("close", () => {
        console.log("Socket Disconnected");
        users.delete(ws);
    });
});

const notifyValidators = (address, value, coords) => {
    console.log("NDVI request...");
    users.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "generator", address, value, coords }));
        }
    });
};

const sendNftReq = (address, amount) => {
    console.log("NFT request...");
    users.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "consumer", address, amount }));
        }
    });
};

module.exports = { notifyValidators, sendNftReq };
