import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

const WebRTCDuet = ({ onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const peerConnection = useRef(null);
  const roomRef = useRef(null);
  
  useEffect(() => {
    const setupMediaStream = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        Alert.alert('Error', 'Could not access microphone. Please check permissions.');
      }
    };
    
    setupMediaStream();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);
  
  const createRoom = async () => {
    try {
      setIsConnecting(true);
      setIsHost(true);
      
      const generatedRoomId = roomId || Math.floor(Math.random() * 1000000).toString();
      setRoomId(generatedRoomId);
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream);
        });
      }
      
      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          Alert.alert('New ICE Candidate', 'In a real app, this would be sent to the remote peer.');
        }
      };
      
      peerConnection.current.ontrack = event => {
        setRemoteStream(event.streams[0]);
      };
      
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      console.log('Created offer:', offer);
      Alert.alert('Room Created', `Your room ID is: ${generatedRoomId}. Share this with your duet partner.`);
      
      setIsConnecting(false);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
      setIsConnecting(false);
    }
  };
  
  const joinRoom = async () => {
    if (!joinRoomId) {
      Alert.alert('Error', 'Please enter a room ID to join.');
      return;
    }
    
    try {
      setIsConnecting(true);
      setIsHost(false);
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream);
        });
      }
      
      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
        }
      };
      
      peerConnection.current.ontrack = event => {
        setRemoteStream(event.streams[0]);
      };
      
      Alert.alert('Joining Room', `Attempting to join room: ${joinRoomId}`);
      
      const simulatedOffer = {
        type: 'offer',
        sdp: 'v=0\r\no=- 1234567890 1 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio\r\na=msid-semantic: WMS stream_id\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:someufrag\r\na=ice-pwd:someicepwd\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:audio\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n'
      };
      
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(simulatedOffer));
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      console.log('Created answer:', answer);
      
      setIsConnecting(false);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room. Please check the room ID and try again.');
      setIsConnecting(false);
    }
  };
  
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const disconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsHost(false);
    setRoomId('');
    setJoinRoomId('');
    
    onClose();
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Karaoke Duet</Text>
      
      {!isConnected ? (
        <View style={styles.setupContainer}>
          <View style={styles.createRoomContainer}>
            <Text style={styles.sectionTitle}>Create a Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Room ID (optional)"
              value={roomId}
              onChangeText={setRoomId}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={createRoom}
              disabled={isConnecting}
            >
              {isConnecting && isHost ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Room</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.joinRoomContainer}>
            <Text style={styles.sectionTitle}>Join a Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChangeText={setJoinRoomId}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={joinRoom}
              disabled={isConnecting}
            >
              {isConnecting && !isHost ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Join Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.callContainer}>
          <Text style={styles.connectedText}>
            {isHost ? 'Room Created' : 'Connected to Room'}
          </Text>
          <Text style={styles.roomIdText}>Room ID: {isHost ? roomId : joinRoomId}</Text>
          
          <View style={styles.streamContainer}>
            <View style={styles.streamBox}>
              <Text style={styles.streamLabel}>You</Text>
              {localStream && (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.placeholderText}>Audio Only</Text>
                </View>
              )}
            </View>
            
            <View style={styles.streamBox}>
              <Text style={styles.streamLabel}>Partner</Text>
              {remoteStream ? (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.placeholderText}>Audio Only</Text>
                </View>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.placeholderText}>Waiting for partner...</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.mutedButton]}
              onPress={toggleMute}
            >
              <Text style={styles.controlButtonText}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={disconnect}
            >
              <Text style={styles.controlButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Back to Karaoke</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  createRoomContainer: {
    marginBottom: 30,
  },
  joinRoomContainer: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8e44ad',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  callContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  connectedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  roomIdText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  streamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  streamBox: {
    width: '48%',
    aspectRatio: 3/4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  streamLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 4,
    color: '#fff',
    zIndex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#aaa',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  mutedButton: {
    backgroundColor: '#e74c3c',
  },
  endCallButton: {
    backgroundColor: '#e74c3c',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
});

export default WebRTCDuet;