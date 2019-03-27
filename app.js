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

app.get('/', (req, res) => res.send("Hello World"));

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


const mySizes = [720, 1280, 1920];
const myImgSizeNames = ['small_', 'medium_', 'big_'];

function resizeImage(req, res){
        let promiseImg = new Promise((resolve, reject) => {     // Promise is needed, because it is async.
            for (var i = 0; i < 3; i++) {
                console.log(myImgSizeNames[i] + " " + mySizes[i] + ' ' + req.file.originalname)
                gm('./files/OriginalImg_' + req.file.originalname)
                    //console.log(myImgSizeNames[i] + " " + mySizes[i] + ' ' + req.file.originalname)
                    .resize(mySizes[i])
                    .write('./files/' + myImgSizeNames[i] + req.file.originalname, function (err) {
                        if (err) {
                            reject(err);
                            console.log(err);
                        } else {
                            resolve(true);
                            console.log("Image created for");
                        }
                    })
            }
        });
    Promise.all([promiseImg]).then(values => {
        console.log("Erfolg!"); // All Promises are True
    }, reason => {
        console.log("There was an Error!") // All Promises are False
    });

    }



app.listen(process.env.PORT || 80, () => console.log('Server started'));