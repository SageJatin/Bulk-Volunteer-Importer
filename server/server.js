// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const bulkImportRoutes = require('./routes/bulkImport.routes');
app.use('/api/volunteers', bulkImportRoutes);

// MongoDB Connection (Update with your local or Atlas URI)
const MONGO_URI = 'mongodb+srv://admin:iTkAkrjcKGJaeWKp@jatincluster.u1umyip.mongodb.net/bulk-volunteer-db?appName=jatincluster';


mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});