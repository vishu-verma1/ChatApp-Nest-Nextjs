// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { UserService } from './user.service';
// import { UnauthorizedException, UseGuards } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';

// @WebSocketGateway({ cors: { origin: '*' } })
// export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   private activeUsers = new Map<string, string>();

//   constructor(
//     private readonly userService: UserService,
//     private readonly jwtService: JwtService,
//   ) {}
//   @WebSocketServer()
//   server: Server;

//   async handleConnection(client: Socket) {
//     try {
//       const token = client.handshake.query.token as string;
//       if (!token) {
//         throw new UnauthorizedException('No token provided');
//       }
//       const payload = await this.jwtService.verifyAsync(token,{
//         secret: process.env.JWT_SECRET
//       });
//       client.data.user = { id: payload.sub, email: payload.email };
//       console.log(
//         `Client connected usergatway: ${client.id} User: ${payload.email}`,
//       );
//     } catch (error) {
//       console.error(`Connection error: ${error.message}`);
//       client.disconnect();
//     }
//   }

//   async handleDisconnect(client: Socket) {
//     const userId = [...this.activeUsers.entries()].find(
//       ([, socketId]) => socketId === client.id,
//     )?.[0];
//     if (userId) {
//       this.activeUsers.delete(userId);
//       this.userService.updateUserStatus(userId, false);
//       this.broadcastActiveUsers();
//     }
//   }

//   @SubscribeMessage('userjoined')
//   async handleUserJoined(
//     @MessageBody() data: {userId: string},
//     @ConnectedSocket() client: Socket,
//   ) {
//     const {userId} = data     
//     this.activeUsers.set(userId, client.id);
//     this.userService.updateUserStatus(userId, true);
//     this.broadcastActiveUsers();
//   }

//   broadcastActiveUsers() {
//     this.server.emit('activeUsers', Array.from(this.activeUsers.keys()));
//   }
// }
