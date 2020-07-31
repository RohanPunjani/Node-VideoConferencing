//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const cors = require('cors')
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
//const session = require("express-session");
var GoogleStrategy = require('passport-google-oauth20').Strategy;



const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');

app.use(cors())


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieSession({
    name: 'vc-session',
    keys: ['key1', 'key2']
}))



app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(id, done) {
    console.log('Deserialize user called.');
    return done(null, { firstName: 'Foo', lastName: 'Bar' });
  });



  const isLoggedIn = function(req,res,next){
    if(req.user){
        next();
    }else{
        res.sendStatus(401);
    }
}


passport.use(new GoogleStrategy({
    clientID: "189132062627-u5voq0flg0idbfhq5jf3oolo8a2ohmtd.apps.googleusercontent.com",
    clientSecret: "gjYJP396uGK8CFA9WkyMUtv3",
    callbackURL: "http://localhost:3000/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
  }
));

app.get("/",function(req,res){
    res.send("woah");
});

app.get("/failed", function (req, res) {
    res.send("You're failed To Login ,press F to continue");
});

app.get("/good", (isLoggedIn,req, res) => {
    res.redirect("/good");
});
app.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

app.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/failed   '
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/good');
    });

app.get("/logout",function(req,res){
    req.session = null;
    req.logout();
    res.redirect("/");
})


app.listen(3000, function () {
    console.log("port started on 3000");
});
