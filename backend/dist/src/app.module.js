"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = exports.REDIS_CONFIG = exports.MQTT_CONFIG = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const logs_service_1 = require("./logs/logs.service");
const mqtt = require("mqtt");
const ioredis_1 = require("ioredis");
const logs_gateway_1 = require("./logs/logs.gateway");
const cache_manager_1 = require("@nestjs/cache-manager");
const { MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, MQTT_CLIENT_ID, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, } = process.env;
exports.MQTT_CONFIG = {
    host: MQTT_HOST,
    port: MQTT_PORT,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: MQTT_CLIENT_ID,
};
exports.REDIS_CONFIG = {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
};
let AppModule = exports.AppModule = class AppModule {
};
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [cache_manager_1.CacheModule.register({ isGlobal: true })],
        controllers: [],
        providers: [
            logs_gateway_1.LogsGateway,
            logs_service_1.LogsService,
            prisma_service_1.PrismaService,
            {
                provide: 'MQTT_CLIENT',
                useFactory: () => {
                    return mqtt.connect(exports.MQTT_CONFIG);
                },
            },
            {
                provide: 'REDIS_CLIENT',
                useFactory: () => {
                    const client = new ioredis_1.default(exports.REDIS_CONFIG);
                    client.on('error', (error) => {
                        console.log('Redis client error:', error);
                    });
                    return client;
                },
            },
            {
                provide: 'REDIS_NON_SUBSCRIBER_CLIENT',
                useFactory: () => {
                    const client = new ioredis_1.default(exports.REDIS_CONFIG);
                    client.on('error', (error) => {
                        console.log('Redis non-subscriber client error:', error);
                    });
                    return client;
                },
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map