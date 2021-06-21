const raiseBtn  = document.querySelector('#raise');
const form = document.querySelector("form");
const input = document.querySelector("#m");
const messages = document.querySelector("#messages");
console.log({user});
const username = user.name.givenName;
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(USER_ID, {
  host: "/",
  port: "3001",
});
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      console.log({call, stream});
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
    myPeer.on('error', (err)=>{
      console.log("Something went wrong : ",err);
    })
    socket.on("user-connected", (id) => {
      connectToNewUser(id, stream);
    });
  }).catch((err)=>{
    console.log("Failed to get Stream: ", err);
  });

socket.on("user-disconnected", (user) => {
  if (peers[user.id]) peers[user.id].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  console.log(userId,stream);
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  console.log(call);
  call.on("stream", function(userVideoStream) {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
    document.getElementById('video_'+USER_ID).style.display="none";
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  console.log("Add Video Stream");
  video.srcObject = stream;
  video.id="video_"+USER_ID;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  OverlayComponent = document.createElement("div");
  OverlayComponent.append(video);
  videoGrid.append(OverlayComponent);
  console.log("Appended Video");
}



raiseBtn.addEventListener('click', function(event){
    event.preventDefault();
    addMessage(username + " raised his hand");
    socket.emit("raised_hand",{});
})
form.addEventListener("submit", function(event) {
    event.preventDefault();
    addMessage(username + ": " + input.value);

    socket.emit("chat_message", {
        user: user,
        message: input.value
    });

    input.value = "";
    return false;
}, false);

socket.on("chat_message", function(data) {
    addMessage(data.user.name.givenName + ": " + data.message);
});
socket.on("raised_hand", function(data) {
    addMessage(data.user.name.givenName + " raised his hand!");
});

socket.on("user_join", function(data) {
    addMessage(data.name.givenName + " just joined the chat!");
});

socket.on("user_leave", function(data) {
    addMessage(data.name.givenName + " has left the chat.");
});
socket.emit("user_join", user);

function addMessage(message) {
    const li = document.createElement("li");
    li.innerHTML = message;
    messages.appendChild(li);
    window.scrollTo(0, document.body.scrollHeight);
}
