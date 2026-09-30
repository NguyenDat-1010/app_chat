const express = require('express');
const app = express();
const port = 4000;
const morgan = require('morgan');
const connectDB = require("./config/db.js");


require('dotenv').config();

const authRoutes = require('./routes/authRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');

app.use(express.json());

app.use(morgan('combined'));

connectDB();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//routes
app.use('/api/auth', authRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});