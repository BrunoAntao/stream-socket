const peerConnections = {};
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};

const id = window.location.href.split('/').at(-1);

const socket = io.connect();
const video = document.querySelector("video");

socket.emit("watcher", id);

socket.on("offer", (id, description) => {

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
        });

    peerConnection.ontrack = event => {
        video.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {

        if (event.candidate) {

            socket.emit("candidate", id, event.candidate);

        }

    };

    peerConnection.oniceconnectionstatechange = function () {

        if (peerConnection.iceConnectionState == 'disconnected') {

            video.style.display = 'none';

        }

    }

    video.style.display = 'block';

});

socket.on("candidate", (id, candidate) => {
    peerConnections[id]
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
});

window.addEventListener('beforeunload', () => {

    Object.keys(peerConnections).forEach(id => {

        peerConnections[id].close();
        delete peerConnections[id];

    })
    socket.close();

})