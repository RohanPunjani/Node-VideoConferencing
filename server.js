//jshint esversion:6
const express = require('express')
const { Socket } = require('dgram')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const ejs = require("ejs");
const cors = require('cors')
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
var restify = require('restify');
var GoogleStrategy = require('passport-google-oauth20').Strategy;


app.set('view engine', 'ejs')

// Middlewares
app.use(express.static('public'))
app.use(cors())
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'vc-session',
    keys: ['key1', 'key2']
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(restify.plugins.queryParser({ mapParams: false }));


//passport
let user ={
    id: '',
    name: ''
}
passport.serializeUser(function(user, done) {
    // user.id = user.id;
    // user.name = user.displayName;
    // console.log("USer => ", user.name);
    req.session.userId = user.id;
    req.session.username = user.displayName;
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    user.id = '';
    user.name = '';
    return done(false, { firstName: 'Foo', lastName: 'Bar' });
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




// Routes :)
app.get('/home', (req,res) => {
    user.id= req.session.userId,
    user.name= req.session.userName,
    console.log(user)
    res.render('home', {user: user});
})
app.get('/create', (req,res) => {
    res.render('create', {roomId: `/${uuidV4()}`})
})
app.get('/join', (req,res) => {
    res.render('join')
})
app.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));
app.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/failed'
}),(req, res) => {
    req.session.userId = req.user.id;
    req.session.userName = req.user.displayName;
    console.log("At success " + user.id);
    // res.redirect('/home');
});
app.get("/failed", function (req, res) {
    res.send("You're failed To Login ,press F to continue");
});
app.get("/logout",function(req,res){
    req.session = null;
    req.logout();
    res.redirect("/home");
})
app.get('/:room', (req, res) => {
    res.render('room', {roomId: req.params.room})
})



//io
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId);
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        })
    })
})


server.listen(3000)