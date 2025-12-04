"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/pacmachine",
    },
});
//# sourceMappingURL=prisma.config.js.map