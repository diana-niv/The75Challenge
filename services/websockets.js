console.log('websockets.js loaded');

// Import tools we need for real-time chat
const http = require('http');           // HTTP server
const socketio = require('socket.io');  // Real-time communication
const db = require('../services/database.js'); // Database connection

// Set up real-time chat for our app
function setupSocket(server) {
    console.log('setupSocket called');
    const io = socketio(server);        // Create real-time chat system

    // When someone connects to our chat
    io.on('connection', (socket) => {
        console.log('New client connected');
    
        // When someone wants to join a chat room
        socket.on('joinRoom', ({ username, room }) => {
            console.log(`User ${username} joined room ${room}`);
            socket.join(room);           // Put them in the room
            
            // Save information about this user
            socket.userId = socket.handshake.auth.userId;  // Their user ID (if logged in)
            socket.username = username || 'Guest';         // Their name (or 'Guest' if not logged in)
            socket.room = room;          // Which room they're in
            socket.isGuest = !socket.userId;               // Are they a guest or logged-in user?
            
            console.log(`Socket info:`, { userId: socket.userId, username: socket.username, room: socket.room, isGuest: socket.isGuest });
            
            // Send welcome messages
            socket.emit('message', { user: 'Server', msg: `Welcome to the chat, ${socket.username}!` });
            socket.to(room).emit('message', { user: 'Server', msg: `${socket.username} has joined the room.` });
        });
    
        // When someone sends a message
        socket.on('chatMessage', (msg) => {
            console.log('Received chat message:', { username: socket.username, room: socket.room, msg });
            
            if (socket.room && socket.username) {
                // If this is a logged-in user in a community chat, save the message to database
                if (socket.userId && socket.room.startsWith('room-')) {
                    const communityId = parseInt(socket.room.replace('room-', ''));
                    db.config.query(
                        'INSERT INTO messages (community_id, user_id, username, message) VALUES (?, ?, ?, ?)',
                        [communityId, socket.userId, socket.username, msg],
                        (err, result) => {
                            if (err) console.error('Error saving message:', err);
                        }
                    );
                }
                
                // Send the message to everyone in the same room
                console.log(`Broadcasting message to room ${socket.room}:`, { user: socket.username, msg: msg });
                io.to(socket.room).emit('message', {
                    user: socket.username,
                    msg: msg
                });
            } else {
                console.log('Cannot send message - missing room or username:', { room: socket.room, username: socket.username });
            }
        });
        
        // When someone leaves the chat
        socket.on('disconnect', () => {
            console.log('Client disconnected');
            if (socket.room && socket.username) {
                // Tell everyone else in the room that this person left
                socket.to(socket.room).emit('message', { user: 'Server', msg: `${socket.username} has left the room.` });
            }
        });
    });
}

// Share this function with our main app
module.exports = setupSocket;