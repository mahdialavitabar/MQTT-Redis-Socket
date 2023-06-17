import { PrismaService } from '../../prisma/prisma.service';
import * as mqtt from 'mqtt';
import Redis from 'ioredis';
import { LogsGateway } from './logs.gateway';
export declare class LogsService {
    private readonly prisma;
    private readonly logsGateway;
    private readonly redisClient;
    private readonly mqttClient;
    private readonly redisNonSubscriberClient;
    constructor(prisma: PrismaService, logsGateway: LogsGateway, redisClient: Redis, mqttClient: mqtt.MqttClient, redisNonSubscriberClient: Redis);
    private subscribeToSensorLogs;
    private subscribeToDetectionQueue;
}
