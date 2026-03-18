"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.OfflineQueue = exports.connect = exports.AgentHelm = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "AgentHelm", { enumerable: true, get: function () { return client_1.AgentHelm; } });
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return client_1.connect; } });
var queue_1 = require("./queue");
Object.defineProperty(exports, "OfflineQueue", { enumerable: true, get: function () { return queue_1.OfflineQueue; } });
// Package version
exports.VERSION = '0.1.0';
//# sourceMappingURL=index.js.map