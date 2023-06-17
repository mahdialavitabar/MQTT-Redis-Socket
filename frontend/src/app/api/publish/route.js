// pages/api/route.js
import Redis from 'ioredis';
import {NextResponse} from "next/server";

const redis = new Redis({
    host: 'sepehr.carriot.ir',
    port: 6379,
    password: 'asb31cdnaksord',
});


export async function POST(request,response) {
    const { channel, message } = request.body;

    redis.publish(channel, message);

    response.status(200).json({ success: true });
}
