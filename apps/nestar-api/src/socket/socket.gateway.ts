import { Logger } from '@nestjs/common';                                        // Log yozish uchun
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // WebSocket dekoratorlari
import { Server } from 'ws';    // WebSocket Server tipi
import * as WebSocket from "ws";
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as  Url  from 'url';

interface MessagePayload {
  event: string;
  text: string;
  memberData: Member | null | undefined;
}

interface InfoPayload {
  event: string;
  totalClients: number;
  memberData: Member | null | undefined;
  action: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })                 // WebSocket Gateway, xavfsiz emas (dev uchun)
export class SocketGateway implements OnGatewayInit {                          // OnGatewayInit — server ishga tushganda chaqiriladi
  private logger: Logger = new Logger('SocketEventsGateway');                  // Logger yaratadi (SocketEventsGateway nomi bilan)
  private summaryClient: number = 0;                                           // Ulangan clientlar soni (default: 0)
  private clientsAuthMap = new Map<WebSocket, Member | null>
  private messagesList: MessagePayload[] = [];
 
  constructor(private authService: AuthService) {}

@WebSocketServer()
server: Server;

  public afterInit(server: Server) {                                            // Server ishga tushganda chaqiriladi
    this.logger.log(`WebSocket Server Initialized & total: [${this.summaryClient}]`); // Server ishga tushganini log qiladi
  }

 private async retrieveAuth(req: any): Promise<Member | null> {
  try {
    const parseUrl = Url.parse(req.url, true);
    const { token } = parseUrl.query;
    return await this.authService.verifyToken(token as string);
  } catch (err) {
    return null;
  }
}

    public async handleConnection(client: WebSocket, req: any) {
      const authMember = await this.retrieveAuth(req);
      this.summaryClient++;
      this.clientsAuthMap.set(client, authMember);
    
      const clientNick: string = authMember?.memberNick ?? 'Guest';
      this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClient}]`);
    
      const infoMsg: InfoPayload = {
        event: 'info',
        totalClients: this.summaryClient,
        memberData: authMember,
        action: 'joined',
      };
      this.emitMessage(infoMsg);
      client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList}));
    }
    
    public handleDisconnect(client: WebSocket) {
      const authMember = this.clientsAuthMap.get(client);
      this.summaryClient--;
      this.clientsAuthMap.delete(client);
    
      const clientNick: string = authMember?.memberNick ?? 'Guest';
      this.logger.verbose(`Disconnection [${clientNick}] & total [${this.summaryClient}]`);
    
      const infoMsg: InfoPayload = {
        event: 'info',
        totalClients: this.summaryClient,
        memberData: authMember,
        action: 'left',
      };
      this.broadcastMessage(client, infoMsg);
    }
    
  
   @SubscribeMessage('message')
    public async handleMessage(client: WebSocket, payload: string): Promise<void> {
        const authMember = this.clientsAuthMap.get(client);
        const newMessage: MessagePayload = { event: 'message', text: payload, memberData: authMember };
    
        const clientNick: string = authMember?.memberNick ?? 'Guest';
        this.logger.verbose(`NEW MESSAGE [${clientNick}]: ${payload}`);
         
        this.messagesList.push(newMessage);  
        if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);
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

/*
MESSAGE TARGET:
1. Client (only client)
2. Broadcast (except client)
3. Emit (all clients)
*/
