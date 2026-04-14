const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isOk = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype.split('/')[1]);
  isOk ? cb(null, true) : cb(new Error('Only image files allowed'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
