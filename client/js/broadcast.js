const peerConnections = {};
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};

const constraints = {
    video: {
        frameRate: 60,
        cursor: "always",
        width: 1920,
        height: 1080
    },
    audio: {
        echoCancellation: false,
        googleAutoGainContol: false
    }
};

let stream = (name) => {

    navigator.mediaDevices
        .getDisplayMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            socket.emit('broadcaster', name);
        })
        .catch(error => console.error(error));

}

const id = window.location.href.split('/').at(-1);

const socket = io.connect();
const video = document.querySelector("video");

stream(id);

socket.on("watcher", id => {

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = video.srcObject;
    stream.getTracks().forEach(track => {
        console.log(track, stream);
        console.log()
        peerConnection.addTrack(track, stream)
    });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("offer", id, peerConnection.localDescription);
        });

});

socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
});

socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
    peerConnections[id].close();
    delete peerConnections[id];
});

window.addEventListener('beforeunload', () => {

    Object.keys(peerConnections).forEach(id => {

        peerConnections[id].close();
        delete peerConnections[id];

    })
    socket.close();

})