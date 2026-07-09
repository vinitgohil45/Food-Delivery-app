import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    // Connect to backend server using proxy routing or port 5000 fallback
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Real-Time WebSocket connected.');
    });

    // Wire up global real-time notification alerts
    newSocket.on('order:new', (order) => {
      toast.info(`🔔 New incoming order received! Reference: ${order.orderNumber}`);
    });

    newSocket.on('order:accepted', (order) => {
      toast.success(`🍕 Your order ${order.orderNumber} has been accepted by the restaurant!`);
    });

    newSocket.on('order:preparing', (order) => {
      toast.info(`🍳 The kitchen is now preparing your order ${order.orderNumber}`);
    });

    newSocket.on('order:ready', (order) => {
      toast.success(`📦 Order ${order.orderNumber} is prepared and ready for pickup!`);
    });

    newSocket.on('order:picked_up', (order) => {
      toast.success(`🚴 Order ${order.orderNumber} has been picked up by the delivery partner.`);
    });

    newSocket.on('order:on_the_way', (order) => {
      toast.info(`🛵 Order ${order.orderNumber} is on the way!`);
    });

    newSocket.on('order:delivered', (order) => {
      toast.success(`🎉 Order ${order.orderNumber} has been delivered! Enjoy your meal!`);
    });

    newSocket.on('notification:new', (notif) => {
      toast.info(`🔔 ${notif.title}: ${notif.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
export default SocketContext;
