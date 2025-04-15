"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import socket from '@/utils/socketIO'

const SocketContext = createContext(socket);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketInstance, setSocketInstance] = useState(socket);

  useEffect(() => {
    socket?.connect();

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);