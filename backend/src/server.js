const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO real-time websocket server
initSocket(server);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orgs', require('./routes/orgRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'SmartQ Backend with Socket.IO & AI Bridge',
    timestamp: new Date()
  });
});

app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SmartQ Server & Socket.IO running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
