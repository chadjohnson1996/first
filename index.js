const app = require('express')();

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require("multer");

// initialize how the files are stored on disk
const storage = multer.diskStorage({
    // this sets the destination directory
    // note that it does not create the folder
    // if the a folder called 'uploads' in the root directory of
    // your node project doesn't exist, it will error out
    // feel free to create the folder however you want
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
      // this sets the file name to write the file out as
      // in this case, it is the name the client configures as the file name
    cb(null, file.originalname);
  }
})

// set the upload handler
const upload = multer({ storage: storage })

mongoose.connect('mongodb://localhost/my_db', { useNewUrlParser: true });

const User = require('./models/user');
const PORT = process.env.PORT || 9000;

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes - Server
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to my Backend App'
    });
});

app.get('/about', (req, res) => {
    res.json({
        message: `I am the about route`
    });
});

// the axios-fileupload library automatically sets the files to
// use a form field name 'file' in the client, but if you are manually creating a form
// you might specify a different name, in which case you would want to use
// upload.single(your_file_name)
app.post('/file_upload', upload.single('file'), (req, res) => {});


// Authentication Routes

app.get('/profile/:email', function (req, res) {
    console.log('inside of get the profile with email');
    console.log('params', req.params.email);

    // convert email input to lower case
    const lowerEmail = req.params.email.toLowerCase();

    User.findOne({ email: lowerEmail })
        .exec(function (err, doc) {
            if (err) {
                console.log("Error finding profile: ", err);
                res.json({
                    status: 500,
                    message: 'Error finding profile for current login', // not unique email
                    // customMessage: 'Error - this email already used'
                })
            }
            else {
                console.log('Profile Document', doc);
                res.json(doc);
            }
        });
});


app.post('/signup', (req, res) => {
    const data = req.body;

    const displayname = data.displayname;
    const email = data.email;
    const password = data.password;
    const yourname = data.yourname;
    const age = data.age;
    const city = data.city;
    const yourstate = data.yourstate;
    const profilepic = data.profilepic;
    const pictures = data.pictures;

    // convert email to lower case
    const lowerEmail = data.email.toLowerCase();


    console.log("SignUp Data = ", data);

    // to encrypt user password    
    const salt = bcrypt.genSaltSync(10);
    const encryptedPassword = bcrypt.hashSync(password, salt);
    // Store hash in your password DB.

    User.init() // to enforce uniqueness
        .then(() => {

            User.create({
                displayname: data.displayname,
                email: lowerEmail,
                // email: data.email,
                //password: password,
                password: encryptedPassword,
                yourname: data.yourname,
                age: data.age,
                city: data.city,
                yourstate: data.yourstate,
                profilepic: data.profilepic,
                // pictures: pictures
            })
                .then(function () {
                    // res.cookie('email', email).json({
                    console.log("I am in the then creating a user");
                    res.json({
                        status: 200,
                        message: 'Success - New User Created'
                    })
                })

                .catch(function (err) {
                    // res.customMessage = emailexistsmsg;
                    // res.status(500).json(emailexistsmsg)
                    // res.status(500).json({
                    console.log("I am in the catch creating the user", err);
                    // res.json({
                    res.json({
                        status: 500,
                        message: 'Error - New User NOT Created', // not unique email
                        // customMessage: 'Error - this email already used'
                    })
                });

            // res.json({
            //     message: 'User was created'
            // });

        })
        .catch(() => {
            res.status(500).json({
                message: 'We were not able to create the user'

            });

        });

    // if want to send unsuccessful response - default is 200
    // res.status(401).json({
    // res.json({
    //     message: 'I Received the SignUp Data'
    // });
});

app.post('/login', (req, res) => {
    const data = req.body;
    const email = data.email;

    const password = data.password;  // plain text password
    console.log("Login Data = ", data);
    const isPasswordValid = false;

    // convert email to lower case
    const lowerEmail = data.email.toLowerCase();

    User.findOne({ email: lowerEmail })
        .then((user) => {
            console.log("User = ", user);

            // Load hash from your password DB.
            const isPasswordValid = bcrypt.compareSync(password, user.password); // true
            console.log("Password = ", password);
            console.log('user.password = ', user.password);
            // if (password === user.password) {
            //     isPasswordValid = true;
            // } // true

            // if valid password
            console.log("Ispasswordvalid = ", isPasswordValid);
            if (isPasswordValid) {
                res.json({
                    message: 'Success - valid user and password',
                    id: user._id
                });
            }
            else {
                res.status(500).json({
                    message: "Invalid Password"
                });
            }

        })
        .catch(() => {
            res.status(500).json({
                message: "No user found with this email:\nPlease Signup as a new user"
            })
        });
});

app.post('/updateprofile', (req, res) => {
    const data = req.body;

    console.log("Change Profile Data = ", data);
    const lowerEmail = data.email.toLowerCase();

    User.updateOne(
        { email: lowerEmail }, //filter
        {
            // fields updated
            $set: {
                "displayname": data.displayname,
                "yourname": data.yourname,
                "age": data.age,
                "city": data.city,
                "yourstate": data.yourstate,
                "profilepic": data.profilepic
            }
        }
    )
        .then((obj) => {
            console.log('Updated Profile Object- ' + obj);
            res.json({
                message: `SUCCESS: Your profile has been updated`
            });
        })
        .catch((error) => {
            console.log('Error in Update Profile: ' + err);
            res.status(500).json({
                message: "ERROR: user profile did not update"
            })
        });
    // .catch((err) => {
    //     console.log('Error: ' + err);
    // })




    // console.log("Change Profile Data = ", data);
    // res.json({
    //     message: `I am returning from the change profile route`
    // });

});



app.listen(PORT, () => {
    console.log(`Server is starting at Port ${PORT}`);
})

