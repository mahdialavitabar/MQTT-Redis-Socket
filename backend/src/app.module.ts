import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from './logs/logs.service';
import * as mqtt from 'mqtt';
import Redis from 'ioredis';
import {LogsGateway} from "./logs/logs.gateway";
import { CacheModule } from '@nestjs/cache-manager';
const {
  MQTT_HOST,
  MQTT_PORT,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_CLIENT_ID,
  REDIS_HOST,
  REDIS_PORT ,
  REDIS_PASSWORD,
} = process.env;

export const MQTT_CONFIG = {
  host:  MQTT_HOST,
  port:  MQTT_PORT,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: MQTT_CLIENT_ID,
}

export const REDIS_CONFIG = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
}

@Module({
  imports: [CacheModule.register({ isGlobal: true })],
  controllers: [],
  providers: [
    LogsGateway,
    LogsService,
    PrismaService,
    {
      provide: 'MQTT_CLIENT',
      useFactory: () => {
        return mqtt.connect(MQTT_CONFIG);
      },
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const client = new Redis(REDIS_CONFIG);
        client.on('error', (error) => {
          console.log('Redis client error:', error);
        });
        return client;
      },
    },
    // Add a new provider for the non-subscriber Redis client
    {
      provide: 'REDIS_NON_SUBSCRIBER_CLIENT',
      useFactory: () => {
        const client = new Redis(REDIS_CONFIG);
        client.on('error', (error) => {
          console.log('Redis non-subscriber client error:', error);
        });
        return client;
      },
    },
  ],
})
export class AppModule {}
