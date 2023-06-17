import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3001',
    },
})
export class LogsGateway {
    @WebSocketServer()
    server: Server;

    handleNewLog(log: any) {
        this.server.emit('log', log);
    }

    handleNewWarningLog(warningLog: any) {
        this.server.emit('warningLog', warningLog);
    }
}
