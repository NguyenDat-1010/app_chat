const mongoose = require('mongoose');
const User = require('./User');
const Conversation = require('./Conversation');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'

            }
        ]
    },
    {
        timestamps: true
    }
);
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);