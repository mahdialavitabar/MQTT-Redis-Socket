"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const mqtt = require("mqtt");
const ioredis_1 = require("ioredis");
const logs_gateway_1 = require("./logs.gateway");
const cache_manager_1 = require("@nestjs/cache-manager");
let LogsService = exports.LogsService = class LogsService {
    constructor(prisma, logsGateway, redisClient, mqttClient, redisNonSubscriberClient) {
        this.prisma = prisma;
        this.logsGateway = logsGateway;
        this.redisClient = redisClient;
        this.mqttClient = mqttClient;
        this.redisNonSubscriberClient = redisNonSubscriberClient;
        this.subscribeToSensorLogs();
        this.subscribeToDetectionQueue();
        this.getAllPersistedLogs();
        this.getAllPersistedWarningLogs();
        setInterval(() => {
            this.getAllPersistedLogs();
        }, 10000);
        setInterval(() => {
            this.getAllPersistedWarningLogs();
        }, 10000);
    }
    async getAllPersistedLogs() {
        const persistedLogs = await this.prisma.log.findMany();
        this.logsGateway.handleNewLog(persistedLogs);
        console.log(persistedLogs);
    }
    async getAllPersistedWarningLogs() {
        const persistedWarningLogs = await this.prisma.warning.findMany();
        this.logsGateway.handleNewWarningLog(persistedWarningLogs);
        console.log(persistedWarningLogs);
    }
    async subscribeToSensorLogs() {
        this.mqttClient.on('connect', () => {
            console.log('MQTT client connected');
        });
        this.mqttClient.on('error', (error) => {
            console.log('MQTT client error:', error);
        });
        this.redisClient.on('connect', () => {
            console.log('REDIS_SUBSCRIBER_CLIENT connected');
        });
        this.redisClient.on('error', (error) => {
            console.log('Redis client error:', error);
        });
        this.mqttClient.subscribe('sensor_logs');
        this.mqttClient.on('message', async (topic, payload) => {
            console.log(topic, payload);
            if (topic === 'sensor_logs') {
                const log = JSON.parse(payload.toString());
                console.log(topic, log);
                this.redisNonSubscriberClient.set(`log:${log.DeviceID}`, JSON.stringify(log));
                this.logsGateway.handleNewLog(log);
                if (log.WarningType) {
                    this.redisNonSubscriberClient.publish('has_warnings_queue', JSON.stringify(log));
                }
                else {
                    await this.prisma.log.create({ data: log });
                }
            }
        });
    }
    async subscribeToDetectionQueue() {
        this.redisClient.on('connect', () => {
            console.log('REDIS_NON_SUBSCRIBER_CLIENT connected');
        });
        this.redisClient.on('error', (error) => {
            console.log('Redis client error:', error);
        });
        this.redisClient.subscribe('detection_queue');
        this.redisClient.on('message', async (channel, message) => {
            console.log(channel, message);
            if (channel === 'detection_queue' && message.includes("WarningType") && !message.includes(`DeviceId`)) {
                const warning = JSON.parse(message);
                console.log(warning);
                await this.prisma.warning.create({ data: warning });
                this.redisNonSubscriberClient.set(`warning:${warning.DeviceID}`, JSON.stringify(warning));
                this.logsGateway.handleNewWarningLog(warning);
            }
        });
        this.redisClient.subscribe('has_warnings_queue');
        this.redisClient.on('message', async (channel, message) => {
            if (channel === 'has_warnings_queue') {
                this.redisNonSubscriberClient.publish('detection_queue', message);
            }
        });
    }
};
__decorate([
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogsService.prototype, "getAllPersistedLogs", null);
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(3, (0, common_1.Inject)('MQTT_CLIENT')),
    __param(4, (0, common_1.Inject)('REDIS_NON_SUBSCRIBER_CLIENT')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logs_gateway_1.LogsGateway,
        ioredis_1.default, mqtt.MqttClient, ioredis_1.default])
], LogsService);
//# sourceMappingURL=logs.service.js.map