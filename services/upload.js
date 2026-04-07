const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


// Create upload folder if it doesn't exist
if (!fs.existsSync('./uploads/profiles')) {
    fs.mkdirSync('./uploads/profiles', { recursive: true });
}

// Check if file is an image
function isImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.mimetype);
}

// Storage for profile pictures
// const profileStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads/profiles/');
//     },
//     filename: function (req, file, cb) {
//         const newName = 'profile-' + Date.now() + path.extname(file.originalname);
//         cb(null, newName);
//     }
// });
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const newName = 'profile-' + uuidv4() + path.extname(file.originalname);
        cb(null, newName);
    }
});

// Create upload handler
const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function(req, file, cb) {
        if (isImage(file)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'));
        }
    }
});

// Handle upload errors
function handleUploadError(error, req, res, next) {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too big! Max 5MB allowed.'
        });
    }

    if (error.message === 'Only image files allowed!') {
        return res.status(400).json({
            error: 'Only image files allowed!'
        });
    }

    next(error);
}

const deleteOldProfilePic = (oldFileName) => {
    if (!oldFileName) return;

    const filePath = path.join(__dirname, '..', 'uploads/profiles', oldFileName);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting old profile picture:', err);
                else console.log('Old profile picture deleted:', filePath);
            });
        }
    });
};


module.exports = {
    profileUpload,
    handleUploadError,
    deleteOldProfilePic
};