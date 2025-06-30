// File upload configuration (Multer setup)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const STORAGE_TYPE = process.env.STORAGE_TYPE || "LOCAL";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) * 1024 * 1024 || 10 * 1024 * 1024; // 10MB

// Multer Configuration for PDF/PPT Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (STORAGE_TYPE === "LOCAL") {
      const teamId = req.body.team_id;
      if (!teamId) {
        return cb(new Error("Team ID is required"));
      }

      // Directory for the specific team
      const teamDir = path.join(__dirname, `../${UPLOAD_DIR}/team_${teamId}`);

      // Create directory if not exists
      if (!fs.existsSync(teamDir)) {
        fs.mkdirSync(teamDir, { recursive: true });
      }

      cb(null, teamDir);
    } else {
      // Cloud storage (future implementation)
      cb(new Error("Cloud storage not configured yet"));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File Filter (PDF, PPT, PPTX)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PPT, and PPTX files are allowed"));
  }
};

// Multer Upload Configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: "outcome", maxCount: 1 },
  { name: "report", maxCount: 1 },
  { name: "ppt", maxCount: 1 },
]);

module.exports = upload;
