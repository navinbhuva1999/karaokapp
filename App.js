
import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  LogBox,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import AudioProcessor from './src/components/AudioProcessor';
import FavoriteSongs from './src/components/FavoriteSongs';
import WebRTCDuet from './src/components/WebRTCDuet';

LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'Possible Unhandled Promise Rejection',
  'RTCPeerConnection',
]);

function MainApp() {
  const [showDuet, setShowDuet] = useState(false);
  
  const toggleDuet = () => {
    setShowDuet(!showDuet);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Karaoke App</Text>
        <TouchableOpacity 
          style={styles.duetButton}
          onPress={toggleDuet}
        >
          <Text style={styles.duetButtonText}>Duet Mode</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <AudioProcessor />
        <FavoriteSongs />
      </View>
      
      <Modal
        visible={showDuet}
        animationType="slide"
        onRequestClose={() => setShowDuet(false)}
      >
        <WebRTCDuet onClose={() => setShowDuet(false)} />
      </Modal>
    </SafeAreaView>
  );
}

function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  duetButton: {
    backgroundColor: '#03DAC6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  duetButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default App; 