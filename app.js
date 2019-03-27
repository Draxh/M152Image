const express = require('express');
const multer = require('multer');
const path = require('path');
const gm = require('gm');

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './files',
    filename: function(req, file, cb){
        cb(null, "OriginalImg_" + file.originalname); // This is the filename that will be saved
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('');

// Check File Type
function checkFileType(file, cb){
    // Allowed ext (regex)
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!', false);
    }
}

// Init app
const app = express();


// Public Folder
app.use('/files', express.static(__dirname + '/files'));

app.get('/', (req, res) => res.send("Hello World!"));

app.post('/api/files', (req, res) => {
    upload(req, res, (err) => {
        if(err){
          res.sendStatus(400)
        } else {
            res.sendStatus(201);
            resizeImage(req, res);
        }
    });
});

function resizeImage(req, res){
        let smallImage = new Promise((resolve, reject) => {     // Promise is needed, because it is async.
            gm('./files/OriginalImg_' + req.file.originalname) // Get Image from folder
                .resize(720)
                .write('./files/' + 'small_' + req.file.originalname, function (err) {  // Create Img
                    if (err) {  // Promise is false
                        reject(err);
                        console.log(err);
                    } else { // Promise is true
                        resolve(true);
                    }
                })
        });
        let mediumImage = new Promise((resolve, reject) => {
            gm('./files/OriginalImg_' + req.file.originalname)
                .resize(1280)
                .write('./files/' + 'medium_' + req.file.originalname, function (err) {
                    if (err) {
                        reject(err);
                        console.log("Error: " + err);
                    } else {
                        resolve(true);
                    }
                })
        });
        let bigImage = new Promise((resolve, reject) => {
            gm('./files/OriginalImg_' + req.file.originalname)
                .resize(1920)
                .write('./files/' + 'big_' + req.file.originalname, function (err) {
                    if (err) {
                        reject(err);
                        console.log(err);
                    } else {
                        resolve(true);
                    }
                })
        });
    Promise.all([smallImage, mediumImage, bigImage]).then(values => {
        console.log("Erfolg!"); // All Promises are True
    }, reason => {
        console.log("There was an Error!") // All Promises are False
    });

    }



app.listen(process.env.PORT || 80, () => console.log('Server started'));