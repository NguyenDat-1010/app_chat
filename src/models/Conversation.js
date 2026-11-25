const mongoose = require('mongoose');
const User = require('./User');

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: User,
                required: true
            }

        ],
        isGroup: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            trim: true,
            maxlength: 100
        },
        avatar: {
            type: String
        },
        admin: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    });
conversationSchema.index({ participants: 1, updatedAt: -1 });
module.exports = mongoose.model('Conversation', conversationSchema);