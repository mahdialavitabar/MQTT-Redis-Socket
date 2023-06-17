import { Server } from 'socket.io';
export declare class LogsGateway {
    server: Server;
    handleNewLog(log: any): void;
    handleNewWarningLog(warningLog: any): void;
}
