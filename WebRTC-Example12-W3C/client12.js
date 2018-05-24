var signalingChannel = new WebSocket('ws://localhost:9090');
var configuration = { iceServers: [{ urls: "stun:stun.1.google.com:19302" }] };
var pc;

var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn');
var connectedUser;


loginBtn.addEventListener("click",function(event){
	console.log("Votre pseudo est : "+loginInput.value);
	name = loginInput.value
	if(name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
});

connectToOtherUsernameBtn.addEventListener("click", function (event) {
	if(!pc)
		start();
});

//Easier dialog with signaling channel
function send(message) { 
   if (connectedUser) { 
      message.name = connectedUser; 
   }
	
   signalingChannel.send(JSON.stringify(message)); 
};

// call start() to initiate
function start() {
	if(!connectedUser)
		connectedUser = otherUsernameInput.value;
	console.log("Beginning start method, connectedUser is "+connectedUser);
    pc = new RTCPeerConnection(configuration);
	
    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
		 send({
               type: "candidate", 
               candidate: event.candidate 
            });
	};
	
	console.log(pc);
	//var trigger = new negotiationneeded()	;
	//pc.dispatchEvent(trigger);
	// let the "negotiationneeded" event trigger offer generation
    pc.onnegotiationneeded = function () {
        pc.createOffer().then(function (offer) {
            return pc.setLocalDescription(offer);
        })
		.then(function() {
			// send the offer to the other peer
			send({ 
			type: "offer", 
            offer: pc.localDescription 
        });
		});
		//.catch(logError);
	};
	
	// once remote track arrives, show it in the remote video element
    pc.ontrack = function (evt) {
        // don't set srcObject again if it is already set.
        //if (!remoteView.srcObject)
        //  remoteView.srcObject = evt.streams[0];
    };
	
	// get a local stream, show it in a self-view and add it to be sent
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (stream) {
            //selfView.srcObject = stream;
            pc.addTrack(stream.getAudioTracks()[0], stream);
            //pc.addTrack(stream.getVideoTracks()[0], stream);
        });
        //.catch(logError);
		
		console.log("Ma connection à la fin de la methode start");	
		console.log(pc);
		
}

signalingChannel.onmessage = function(evt){
	console.log(evt);
	var data = JSON.parse(evt.data);
	
	if(data.type == "coucou")
		return;
	
	
	switch(data.type) {
		// if we get an offer, we need to reply with an answer
		case "offer":
			connectedUser = data.name;
			if(!pc)
			start();
			var desc = data.offer;
			pc.setRemoteDescription(desc).then(function () {
				return pc.createAnswer();
            })
            .then(function (answer) {
                return pc.setLocalDescription(answer);
            })
            .then(function () {
				send({ 
					type: "answer", 
					answer: pc.localDescription 
				});
			});
			//.catch(logError);
			break;
		case "answer":
			if(!pc)
				start();
			var desc = data.answer;
			pc.setRemoteDescription(desc);//.catch(logError);
			break;
		case "login": 
			onLogin(data.success); 
			break;
		case "candidate":
			if(!pc)
				start();
			if(data.candidate != null)
				pc.addIceCandidate(data.candidate);//.catch(logError);
			break;
		default:
			console.log("Unsupported SDP type. Your code may differ here.");
		break;
	}
	
};

function onLogin(success){
	if (success === false) { 
      alert("oops...try a different username"); 
   }
   else {
	console.log("Log successfuly to signaling server");
   }
}

function logError(error) {
    console.log(error.name + ": " + error.message);
}

	
	