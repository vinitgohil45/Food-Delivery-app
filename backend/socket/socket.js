import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication failed: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication failed: Invalid credentials'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`⚡ Socket Connected: User ID [${socket.user._id}] Role [${socket.user.role}]`);

    // Join general user room
    socket.join(`user_${socket.user._id}`);

    // Join role specific rooms
    if (socket.user.role === 'restaurant_owner') {
      socket.join('restaurant_owners');
    } else if (socket.user.role === 'delivery_partner') {
      socket.join('delivery_partners');
    } else if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    // Join order-specific tracking rooms
    socket.on('join:order', ({ orderId }) => {
      socket.join(`order_${orderId}`);
      logger.info(`👤 User [${socket.user._id}] joined Order room [order_${orderId}]`);
    });

    socket.on('leave:order', ({ orderId }) => {
      socket.leave(`order_${orderId}`);
      logger.info(`👤 User [${socket.user._id}] left Order room [order_${orderId}]`);
    });

    // Real-time Driver location streaming
    socket.on('driver:location', async ({ orderId, latitude, longitude }) => {
      if (socket.user.role !== 'delivery_partner') return;

      logger.info(`🚴 Driver [${socket.user.name}] Order [${orderId}]: Coordinates [${latitude}, ${longitude}]`);

      // Update order status or live coordinates cache
      try {
        await Order.findByIdAndUpdate(orderId, {
          'deliveryAddress.location.coordinates': [longitude, latitude],
        });
      } catch (err) {
        logger.error('Failed to update live location in database:', err);
      }

      // Stream to customer order room
      io.to(`order_${orderId}`).emit('order:location', {
        orderId,
        latitude,
        longitude,
        timestamp: new Date(),
      });

      // Stream to admin observers
      io.to('admins').emit('driver:location_admin', {
        orderId,
        driverId: socket.user._id,
        driverName: socket.user.name,
        latitude,
        longitude,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket Disconnected: User ID [${socket.user._id}]`);
    });
  });

  return io;
};

// Global helper to emit events to specific rooms or clients
export const emitSocketEvent = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
    logger.info(`📡 Socket Emitted [${event}] to room [${room}]`);
  } else {
    logger.warn('Socket server not initialized. Unable to emit event.');
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
