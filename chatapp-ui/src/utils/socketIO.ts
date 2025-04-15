import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');


  socket = io(SOCKET_URL, {
    query: {
      token, 
    },
    transports: ['websocket'],
  });
}

export default socket;