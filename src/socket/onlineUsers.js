const Conversation = require('../models/Conversation.js');
const User = require('../models/User.js');
const onlineUsers = new Map();


const getcontactIds = async (userId) => {
    try {
        const conversation = await Conversation.find({
            participants: userId
        });
        const ids = new Set();
        //tim tat ca id co lien quan
        conversation.forEach((c) => {
            c.participants.forEach((p) => {
                if (p.toString() !== userId) {
                    ids.add(p.toString());
                }
            });
        });
        return [...ids];

    } catch (error) {
        console.log('Loi server:', error);
    }
};

const broadcastStatus = async (io, userId, status, lastSeen) => {
    const contactIds = await getcontactIds(userId);
    console.log('BROADCAST', status, 'cua', userId, '-> gui toi:', contactIds);

    contactIds.forEach((id) => {
        io.to(`user:${id}`).emit('user:status', { userId, status, lastSeen });
    });
};




module.exports = { onlineUsers, broadcastStatus, };