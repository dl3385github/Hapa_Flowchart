"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("./config");
// Create a Winston logger instance
const logger = winston_1.default.createLogger({
    level: config_1.config.logLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: { service: 'hapa-flowchart-server' },
    transports: [
        // Write logs to console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, ...rest }) => {
                return `${timestamp} ${level}: ${message} ${Object.keys(rest).length > 0 ? JSON.stringify(rest) : ''}`;
            }))
        })
    ]
});
exports.logger = logger;
// Add file transport in production
if (config_1.config.nodeEnv === 'production') {
    logger.add(new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }));
    logger.add(new winston_1.default.transports.File({ filename: 'logs/combined.log' }));
}
//# sourceMappingURL=logger.js.map