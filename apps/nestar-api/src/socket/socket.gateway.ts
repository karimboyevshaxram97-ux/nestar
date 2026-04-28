import { Logger } from '@nestjs/common';                                        // Log yozish uchun
import { OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'; // WebSocket dekoratorlari
import { Server } from 'ws';                                                    // WebSocket Server tipi

@WebSocketGateway({ transports: ['websocket'], secure: false })                 // WebSocket Gateway, xavfsiz emas (dev uchun)
export class SocketGateway implements OnGatewayInit {                          // OnGatewayInit — server ishga tushganda chaqiriladi
  private logger: Logger = new Logger('SocketEventsGateway');                  // Logger yaratadi (SocketEventsGateway nomi bilan)
  private summaryClient: number = 0;                                           // Ulangan clientlar soni (default: 0)

  public afterInit(server: Server) {                                            // Server ishga tushganda chaqiriladi
    this.logger.log(`WebSocket Server Initialized total: ${this.summaryClient}`); // Server ishga tushganini log qiladi
  }

  handleConnection(client: WebSocket, ...args: any[]) {                        // Yangi client ulanganda chaqiriladi
    this.summaryClient++;                                                       // Clientlar sonini +1 oshiradi
    this.logger.log(`== Client connected total: ${this.summaryClient} ==`);    // Ulangan clientlar sonini log qiladi
  }

  handleDisconnect(client: WebSocket) {                                        // Client uzilganda chaqiriladi
    this.summaryClient--;                                                       // Clientlar sonini -1 kamaytiradi
    this.logger.log(`== Client disconnected left total: ${this.summaryClient} ==`); // Qolgan clientlar sonini log qiladi
  }

  @SubscribeMessage('message')                                                  // 'message' eventini tinglaydi
  public handleMessage(client: WebSocket, payload: any): string {              // Client xabar yuborganda chaqiriladi
    return 'Hello world!';                                                      // Clientga 'Hello world!' qaytaradi
  }
}