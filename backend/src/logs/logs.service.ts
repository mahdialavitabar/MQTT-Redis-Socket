import {Injectable, Inject, UseInterceptors} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as mqtt from 'mqtt';
import Redis from 'ioredis';
import { LogsGateway } from './logs.gateway';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class LogsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logsGateway: LogsGateway,
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        @Inject('MQTT_CLIENT') private readonly mqttClient: mqtt.MqttClient,
        @Inject('REDIS_NON_SUBSCRIBER_CLIENT') private readonly redisNonSubscriberClient: Redis,
    ) {
        this.subscribeToSensorLogs();
        this.subscribeToDetectionQueue();
    }
    @UseInterceptors(CacheInterceptor)
    private async subscribeToSensorLogs() {
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
            console.log(topic,payload)
            if (topic === 'sensor_logs') {
                const log = JSON.parse(payload.toString());
                console.log(topic,log)

                // Cache the log in Redis
                this.redisNonSubscriberClient.set(`log:${log.DeviceID}`, JSON.stringify(log));
                // Broadcast the log to all connected WebSocket clients
                this.logsGateway.handleNewLog(log);
                // Publish the log to the has_warnings_queue if it has a warning
                if (log.WarningType) {
                    this.redisNonSubscriberClient.publish('has_warnings_queue', JSON.stringify(log))
                }else {
                    await this.prisma.log.create({ data: log });
                }
            }
        });
    }

    private async subscribeToDetectionQueue() {
        this.redisClient.on('connect', () => {
            console.log('REDIS_NON_SUBSCRIBER_CLIENT connected');
        });
        this.redisClient.on('error', (error) => {
            console.log('Redis client error:', error);
        });

        this.redisClient.subscribe('detection_queue');
        this.redisClient.on('message', async (channel, message:any) => {
            console.log(channel,message);
            if (channel === 'detection_queue'&& message.includes("WarningType")) {
                const warning = JSON.parse(message);
                console.log(warning)
                await this.prisma.warning.create({ data: warning });

                // Cache the warning log in Redis
                this.redisNonSubscriberClient.set(`warning:${warning.DeviceID}`, JSON.stringify(warning));
                // Broadcast the warning log to all connected WebSocket clients
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

}
