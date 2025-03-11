import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Sound from 'react-native-sound';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import Slider from '@react-native-community/slider';
Sound.setCategory('Playback', true);
const audioOptions = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  wavFile: 'recording.wav',
};
const BACKGROUND_TRACK_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const AudioProcessor = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundSound, setBackgroundSound] = useState(null);
  const [processedSound, setProcessedSound] = useState(null);
  const [pitchFactor, setPitchFactor] = useState(2);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'Karaoke App needs access to your microphone to record audio.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
            initAudioRecord();
          } else {
            Alert.alert('Permission Denied', 'You need to grant microphone permissions to use this app.');
          }
        } catch (err) {
          console.error('Permission request error:', err);
        }
      } else {
        setHasPermission(true);
        initAudioRecord();
      }
    };

    const prepareBackgroundTrack = async () => {
      try {
        setIsLoading(true);
        const localFilePath = `${RNFS.CachesDirectoryPath}/background.mp3`;
        const fileExists = await RNFS.exists(localFilePath);
        
        if (!fileExists) {
          console.log('Downloading background track...');
          const downloadResult = await RNFS.downloadFile({
            fromUrl: BACKGROUND_TRACK_URL,
            toFile: localFilePath,
            progress: (res) => {
              const progress = (res.bytesWritten / res.contentLength) * 100;
              setDownloadProgress(progress);
              console.log(`Downloaded ${progress.toFixed(2)}%`);
            },
            progressDivider: 10,
          }).promise;
          
          if (downloadResult.statusCode !== 200) {
            throw new Error(`Download failed with status code ${downloadResult.statusCode}`);
          }
          
          console.log('Download complete!');
        } else {
          console.log('Using cached background track');
        }
        
        loadBackgroundTrack(localFilePath);
        
      } catch (error) {
        console.error('Error preparing background track:', error);
        Alert.alert(
          'Error',
          'Failed to prepare the background track. Please check your internet connection and try again.'
        );
        setIsLoading(false);
      }
    };

    requestPermissions();
    prepareBackgroundTrack();

    return () => {
      if (backgroundSound) {
        backgroundSound.release();
      }
      if (processedSound) {
        processedSound.release();
      }
      AudioRecord.stop();
    };
  }, []);

  const initAudioRecord = () => {
    AudioRecord.init(audioOptions);
    AudioRecord.on('data', (data) => {
      console.log('Audio data received');
    });
  };

  const loadBackgroundTrack = (filePath) => {
    console.log('Loading sound from path:', filePath);
    const sound = new Sound(filePath, '', (error) => {
      setIsLoading(false);
      if (error) {
        console.error('Failed to load background track:', error);
        Alert.alert('Error', 'Failed to load the background track.');
        return;
      }
      console.log('Sound loaded successfully!');
      console.log('Duration:', sound.getDuration(), 'seconds');
      setBackgroundSound(sound);
    });
  };

  const startRecordingAndPlayback = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
      return;
    }

    if (isLoading) {
      Alert.alert('Loading', 'Please wait for the background track to load.');
      return;
    }

    if (!backgroundSound) {
      Alert.alert('Error', 'Background track not loaded. Please restart the app.');
      return;
    }

    try {
      AudioRecord.start();
      setIsRecording(true);
      backgroundSound.setCurrentTime(0);
      backgroundSound.play((success) => {
        if (!success) {
          console.error('Failed to play background track');
          Alert.alert('Playback Error', 'Failed to play the background track.');
        } else {
          console.log('Playback finished successfully');
        }
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting recording and playback:', error);
      Alert.alert('Error', 'Failed to start recording and playback.');
    }
  };

  const stopRecordingAndPlayback = async () => {
    try {
      if (backgroundSound) {
        backgroundSound.pause();
      }
      setIsPlaying(false);
      const audioFile = await AudioRecord.stop();
      setIsRecording(false);
      console.log('Audio recording saved to:', audioFile);
      Alert.alert('Recording Completed', 'Audio recording saved and ready for processing.');
    } catch (error) {
      console.error('Error stopping recording and playback:', error);
      Alert.alert('Error', 'Failed to stop recording and playback.');
    }
  };

  const applyPitchAdjustment = () => {
    Alert.alert('Pitch Adjustment', `Applied pitch adjustment of ${pitchFactor > 0 ? '+' : ''}${pitchFactor} semitones (simulated)`);
    setTimeout(() => {
      Alert.alert('Processing Complete', 'Audio has been pitch-adjusted (simulated)');
    }, 1000);
  };

  const renderLoadingState = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {downloadProgress < 100 
            ? `Downloading background track: ${downloadProgress.toFixed(0)}%` 
            : 'Preparing audio...'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Audio Processor</Text>
      {renderLoadingState()}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Pitch Adjustment: {pitchFactor > 0 ? '+' : ''}{pitchFactor} semitones</Text>
        <Slider
          style={styles.slider}
          minimumValue={-12}
          maximumValue={12}
          step={1}
          value={pitchFactor}
          onValueChange={value => setPitchFactor(value)}
          minimumTrackTintColor="#6200EE"
          maximumTrackTintColor="#9E9E9E"
          thumbTintColor="#6200EE"
        />
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          isLoading ? styles.disabledButton : (isRecording ? styles.stopButton : styles.startButton)
        ]}
        onPress={isRecording ? stopRecordingAndPlayback : startRecordingAndPlayback}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : (isRecording ? 'Stop Recording & Playback' : 'Start Recording & Playback')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.processButton, (isRecording || isLoading) && styles.disabledButton]}
        onPress={applyPitchAdjustment}
        disabled={isRecording || isLoading}
      >
        <Text style={styles.buttonText}>Apply Pitch Adjustment</Text>
      </TouchableOpacity>
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Recording:</Text>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isRecording ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Playback:</Text>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isPlaying ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Track Loaded:</Text>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: (!isLoading && backgroundSound !== null) ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E8EAF6',
    borderRadius: 4,
    alignItems: 'center',
  },
  loadingText: {
    color: '#3F51B5',
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  button: {
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  processButton: {
    backgroundColor: '#6200EE',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    marginRight: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default AudioProcessor; 