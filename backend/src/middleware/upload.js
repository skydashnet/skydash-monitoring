const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './public/uploads/avatars/',
    filename: function(req, file, cb) {
        const uniqueSuffix = `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('avatar');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Hanya gambar (jpeg, jpg, png, gif) yang diizinkan!');
    }
}

module.exports = upload;