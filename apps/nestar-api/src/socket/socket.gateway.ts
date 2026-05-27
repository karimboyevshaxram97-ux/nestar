import { Logger } from '@nestjs/common';                                        // Log yozish uchun
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // WebSocket dekoratorlari
import { Server } from 'ws';    // WebSocket Server tipi
import * as WebSocket from "ws";

interface MessagePayload {
  event: string;
  text: string;
}

interface InfoPayload {
  event: string;
  totalClients: number;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })                 // WebSocket Gateway, xavfsiz emas (dev uchun)
export class SocketGateway implements OnGatewayInit {                          // OnGatewayInit — server ishga tushganda chaqiriladi
  private logger: Logger = new Logger('SocketEventsGateway');                  // Logger yaratadi (SocketEventsGateway nomi bilan)
  private summaryClient: number = 0;                                           // Ulangan clientlar soni (default: 0)

@WebSocketServer()
server: Server;

  public afterInit(server: Server) {                                            // Server ishga tushganda chaqiriladi
    this.logger.log(`WebSocket Server Initialized & total: [${this.summaryClient}]`); // Server ishga tushganini log qiladi
  }

  handleConnection(client: WebSocket, ...args: any[]) {                        // Yangi client ulanganda chaqiriladi
    this.summaryClient++;                                                       // Clientlar sonini +1 oshiradi
    this.logger.verbose(` Connection & total: [${this.summaryClient} ==]`);    // Ulangan clientlar sonini log qiladi
   
  const infoMsg: InfoPayload = {
    event: 'Info',
    totalClients: this.summaryClient,
  };  
   this.emitMessage(infoMsg);
  }



  handleDisconnect(client: WebSocket) {
  this.summaryClient--;
  this.logger.verbose(`Disconnection & total [${this.summaryClient}]`);

  const infoMsg: InfoPayload = {
    event: 'info',
    totalClients: this.summaryClient,
  };
  this.broadcastMessage(client, infoMsg);
  }
  
 @SubscribeMessage('message')
public async handleMessage(client: WebSocket, payload: string): Promise<void> {
  const newMessage: MessagePayload = { event: 'message', text: payload };
  this.logger.verbose(`NEW MESSAGE: ${payload}`);
  this.emitMessage(newMessage);
}

  
  private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload ) {
    this.server.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  

  private emitMessage(message: InfoPayload | MessagePayload) {
  this.server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}


}