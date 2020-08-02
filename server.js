//jshint esversion:6
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v1: uuidV4 } = require('uuid')
const ejs = require("ejs");
const cors = require('cors')
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
var restify = require('restify');
const { request } = require('http')
const url = require('url')
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


var userprofile;
//passport
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(id, done) {
    return done(false, null );
});

function checkAuthentication(req,res,next){
    if(userprofile){
        next();
    } else{
        res.redirect("/google");
    }
}
passport.use(new GoogleStrategy({
    clientID: "189132062627-u5voq0flg0idbfhq5jf3oolo8a2ohmtd.apps.googleusercontent.com",
    clientSecret: "gjYJP396uGK8CFA9WkyMUtv3",
    callbackURL: "https://quiet-dawn-40296.herokuapp.com/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userprofile = profile;
      return done(null, profile);
  }
));
let host_user = null;



// Routes :)
app.get('/', (req, res) => {
    res.redirect('home');
})
app.get('/home', (req, res) => {
    res.render('home', {user: userprofile});
})
app.get('/create', checkAuthentication, (req,res) => {
    const roomid =  Math.random().toString(36).substr(2, 9);
    host_user = userprofile;
    res.render('create', {roomId: `/${roomid}`, user: userprofile})
})
app.get('/join', checkAuthentication,(req, res) => {
    res.render('join')
})
app.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));
app.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/failed'
}),(req, res) => {
    res.redirect("/home");
});
app.get("/failed", (req, res) => {
    res.send("You're failed To Login ,press F to continue");
});
app.get("/logout", checkAuthentication, (req,res) => {
    req.session = null;
    userprofile = null;
    req.user = null;
    req.logout();
    res.redirect("/home");
})
app.get('/:room', checkAuthentication, (req, res) => {
    res.render('room', {roomId: req.params.room, user: userprofile, host: host_user })
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
    
    socket.on("user_join", function(data) {
        this.username = data;
        socket.broadcast.emit("user_join", data);
    });

    socket.on("chat_message", function(data) {
        data.username = this.username;
        socket.broadcast.emit("chat_message", data);
    });

    socket.on("disconnect", function(data) {
        socket.broadcast.emit("user_leave", this.username);
    });
})

server.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });