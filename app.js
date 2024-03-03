
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt")
const saltRounds = 5
const passport = require("passport")
const passportLocal = require("passport-local")
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")
const TwitterStrategy = require("passport-twitter").Strategy;

const mongodb = require("mongodb")


const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")




const app = express();
console.log(process.env.API);



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())





mongoose.connect("mongodb+srv://manish:manish@cluster3.p3okkmq.mongodb.net/userDB")




const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    twitterId: String,
    secret: String


})




userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)






const User = mongoose.model("User", userSchema)
passport.use(User.createStrategy());



passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});




passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});



//GOOGLE

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://secretserver-xew4.onrender.com/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));




//TWITTER

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_ID,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: "https://secretserver-xew4.onrender.com/auth/twitter/secrets"
},
    function (token, tokenSecret, profile, cb) {
        User.findOrCreate({ twitterId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));




//TWITTER
app.get('/auth/twitter',
    passport.authenticate('twitter'));

app.get('/auth/twitter/secrets',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



//google

app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] })


)

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/secrets');
    });





app.get("/", function (req, res) {
    res.render("home")
})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})
app.get("/secrets", function (req, res) {
    User.find({ "secret": { $ne: null } }).then((foundUsers) => {
        if (foundUsers) {
            res.render("secrets", { userWithSecret: foundUsers })
        }
    })
})
app.get("/logout", function (req, res) {
    res.redirect("/")
})


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/")
    }

})




app.post("/register", function (req, res) {

    User.register({ username: req.body.username, active: false }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }


    })
})





app.post("/login", function (req, res) {
    const newuser = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(newuser, function (err) {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }

    })

})





app.post("/submit", function (req, res) {
    const sunmittedSecret = req.body.secret
    User.findById(req.user.id).then((found) => {
        if (found) {
            found.secret = sunmittedSecret
            found.save().then(() => {
                res.redirect("/secrets")
            })


        }
    }).catch((err) => {
        console.log(err);
    })


})


app.listen(3000, function (req, res) {
    console.log("SERVER STARTED AT 3000");
})

