const mongoose = require('mongoose');
const User = require('./User');
const Conversation = require('./Conversation');
const { url } = require('../config/cloudinary');


const attachmentSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },//link http
        pulicId: { type: String, required: true },//id anh tren cloudi        na
        resoureType: { type: String, required: true },//loai file
        name: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        width: Number,
        height: Number
    },
    {
        _id: false
    }
);

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
            trim: true,
            default: ''
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'

            }
        ],
        type: {
            type: String,
            enum: ['text', 'image', 'file'],
            default: 'text'
        },
        attachments: [attachmentSchema]
    },
    {
        timestamps: true
    }
);
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);