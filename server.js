//jshint esversion:6
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v1: uuidV4 } = require("uuid");
const ejs = require("ejs");
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
var restify = require("restify");
const { request } = require("http");
const url = require("url");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var session = require("express-session");
// app.use(session({secret: 'mySecret'}));
require("./db");

app.set("view engine", "ejs");

// Middlewares
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieSession({
//     name: 'vc-session',
//     keys: ['key1', 'key2']
// }))
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(restify.plugins.queryParser({ mapParams: false }));

// var userprofile;
// var USER;
//passport
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (id, done) {
  return done(false, null);
});

function checkAuthentication(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}
passport.use(
  new GoogleStrategy(
    {
      clientID:process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      // callbackURL: "http://localhost:3000/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);
// Routes :)
app.get("/", (req, res) => {
  res.render("home", { user: req.session.user });
});

// app.get('/users', (req,res)=>{
//     const User = users.findAll();
//     res.send(User);
// })

// app.get('/home', (req, res) => {
//     res.render('home', {user: req.user});
// })
app.get("/create", checkAuthentication, (req, res) => {
  const roomid = Math.random().toString(36).substr(2, 9);
  req.session.user["isHost"] = true;
  res.render("create", { roomId: `/${roomid}`, user: req.session.user });
});
app.get("/join", checkAuthentication, (req, res) => {
  res.render("join", { user: req.session.user });
});
app.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failed",
  }),
  (req, res) => {
    req.user["isHost"] = false;
    req.session.user = req.user;
    res.redirect("/");
  }
);
// app.get('/google/callback',passport.authenticate('google'),(req,res)=>{
//     req.logIn(req.user,(err)=>{
//          res.redirect('/home')
//     });
// })
app.get("/failed", (req, res) => {
  res.send("Google Login Failed");
});
app.get("/logout", (req, res) => {
  req.session.user = null;
  req.user = null;
  req.logout();
  res.redirect("/");
});
app.get("/:room", checkAuthentication, (req, res) => {
  res.render("room", {
    roomId: req.params.room,
    user: req.session.user,
  });
});

//io
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
  socket.on("user_join", function (data) {
    this.username = data.name.givenName;
    socket.broadcast.emit("user_join", data);
  });

  socket.on("chat_message", function (data) {
    data.username = this.username;
    socket.broadcast.emit("chat_message", data);
  });
  socket.on("raised_hand", function (data) {
    data.username = this.username;
    socket.broadcast.emit("raised_hand", data);
  });
  socket.on("disconnect", function (data) {
    socket.broadcast.emit("user_leave", data);
  });
});

server.listen(process.env.PORT || 3000, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});
