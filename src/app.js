const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db.js");

const http = require('http');


//import socket
const initSocket = require('./socket/initSocket');


require('dotenv').config();

const authRoutes = require('./routes/authRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const errorMiddleware = require('./middleware/errorMiddleware.js');
const { apiLimiter } = require('./middleware/rateLimitMiddleware.js');

const app = express();
const port = process.env.PORT;
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use(morgan('combined'));

connectDB();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/user', userRoutes);

app.use(errorMiddleware);


const httpServer = http.createServer(app);

//Khởi tạo socket
const io = initSocket(httpServer);

app.set('io', io);


httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});