let connected = false;
let muted = false;
let videoed = false;
const usernameInput = document.getElementById('username');
const button = document.getElementById('join_leave');
const mutebutton = document.getElementById('mute_unmute');
const videobutton = document.getElementById('video_on_off');
const container = document.getElementById('container');
const count = document.getElementById('count');
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstChild;
        video.appendChild(track.attach());
    });
};

//handle mute-unmute button
function muteButtonHandler(event) {
	event.preventDefault();
	if(!muted){
		room.localParticipant.audioTracks.forEach(publication => {
			publication.track.disable();
		});
		mutebutton.innerHTML = 'Unmute';
		muted = true;
	}
	else{
		room.localParticipant.audioTracks.forEach(publication => {
			publication.track.enable();
		});
		mutebutton.innerHTML = 'Mute';
		muted = false;
	}
};

//handle video on/off button
function videoButtonHandler(event) {
	event.preventDefault();
	if(!videoed){
		room.localParticipant.videoTracks.forEach(publication => {
			publication.track.disable();
		});
		videobutton.innerHTML = 'Unpause Video';
		videoed = true;
	}
	else{
		room.localParticipant.videoTracks.forEach(publication => {
			publication.track.enable();
		});
		videobutton.innerHTML = 'Pause Video';
		videoed = false;
	}
};


//handle connect button
function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        let username = usernameInput.value;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        button.disabled = true;
        button.innerHTML = 'Connecting...';
        connect(username).then(() => {
            button.innerHTML = 'Leave call';
            button.disabled = false;
        }).catch(() => {
            alert('Connection failed. Check if server is up');
            button.innerHTML = 'Join call';
            button.disabled = false;    
        });
    }
    else {
        disconnect();
        button.innerHTML = 'Join call';
        connected = false;
    }
};

//Connecting to a video chat room
function connect(username) {
    let promise = new Promise((resolve, reject) => {
        // get a token from server
        fetch('/login', {
            method: 'POST',
            body: JSON.stringify({'username': username})
        }).then(res => res.json()).then(data => {
            // join video call
            return Twilio.Video.connect(data.token);
        }).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();
            resolve();
        }).catch(() => {
            reject();
        });
    });
    return promise;
};

function updateParticipantCount() {
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};

//Connecting and disconnecting participants
function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', 'participant');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    div.appendChild(track.attach());
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => element.remove());
};

//Disconnecting from the chat room
function disconnect() {
    room.disconnect();
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    button.innerHTML = 'Join call';
	videobutton.innerHTML = 'Pause Video';
	mutebutton.innerHTML = 'Mute';
    connected = false;
	muted = false;
	videoed = false;
    updateParticipantCount();
};

addLocalVideo();
button.addEventListener('click', connectButtonHandler);
mutebutton.addEventListener('click', muteButtonHandler);
videobutton.addEventListener('click', videoButtonHandler);