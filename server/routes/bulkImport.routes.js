// server/routes/bulkImport.routes.js
const express = require('express');
const Volunteer = require('../models/Volunteer');
const router = express.Router();
const upload = require('../middleware/upload');
const bulkImportController = require('../controllers/bulkImport.controller');

// Accepts a multipart/form-data file upload (.csv or .xlsx, max 5 MB) [cite: 14]
router.post('/parse-upload', upload.single('file'), bulkImportController.parseUpload);
router.post('/validate-mapping', bulkImportController.validateMapping);
router.post('/execute-import', bulkImportController.executeImport);

module.exports = router;