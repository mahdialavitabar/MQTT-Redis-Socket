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
        this.getAllPersistedLogs();
        this.getAllPersistedWarningLogs();
        setInterval(() => {
            this.getAllPersistedLogs();
        }, 10000);
        setInterval(() => {
            this.getAllPersistedWarningLogs();
        }, 10000);
    }
    @UseInterceptors(CacheInterceptor)

    private async getAllPersistedLogs(){
        const persistedLogs = await this.prisma.log.findMany()
        this.logsGateway.handleNewLog(persistedLogs);
    }
    private async getAllPersistedWarningLogs(){
        const persistedWarningLogs = await this.prisma.warning.findMany()
        this.logsGateway.handleNewWarningLog(persistedWarningLogs);
    }
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

        function isILogs(obj: any) {
            let logsTypes;
            if( typeof obj.DeviceID === 'string' &&
                typeof obj.DeviceTime === 'string' &&
                typeof obj.Latitude === 'number' &&
                typeof obj.Longitude === 'number' &&
                typeof obj.Altitude === 'number' &&
                typeof obj.Course === 'number' &&
                typeof obj.Satellites === 'number' &&
                typeof obj.SpeedOTG === 'number' &&
                typeof obj.AccelerationX1 === 'number' &&
                typeof obj.AccelerationY1 === 'number' &&
                typeof obj.Signal === 'number' &&
                typeof obj.PowerSupply === 'number')    {
                logsTypes=true
            }else{
                logsTypes=false
            }
            console.log(logsTypes)
return logsTypes
        }


        this.mqttClient.subscribe('sensor_logs');
        this.mqttClient.on('message', async (topic, payload) => {
            let logsTypes
            try {
                const parsedPayload = JSON.parse(payload.toString());
                 logsTypes = isILogs(parsedPayload);
            } catch (error) {
                console.log('Invalid JSON payload:', payload.toString());
            }
            if (topic === 'sensor_logs'&& logsTypes) {
                const log = JSON.parse(payload.toString());
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
        function isWarningsILogs(obj: any) {
            let warningLogsTypes;
            if( typeof obj.DeviceID === 'string' &&
                typeof obj.WarningTime === 'string' &&
                typeof obj.WarningType === 'number'
                )    {
                warningLogsTypes=true
            }else{
                warningLogsTypes=false
            }
            console.log(warningLogsTypes)
            return warningLogsTypes
        }
        this.redisClient.subscribe('detection_queue');
        this.redisClient.on('message', async (channel, message:any) => {
            let warningLogsTypes
            try {
                const parsedPayload = JSON.parse(message);
                warningLogsTypes = isWarningsILogs(parsedPayload);
            } catch (error) {
                console.log('Invalid JSON payload:', message);
            }
            if (channel === 'detection_queue'&& message.includes("WarningType")&& !message.includes(`DeviceId`)&&warningLogsTypes) {
                const warning = JSON.parse(message);
                console.log("warning",warning)
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
