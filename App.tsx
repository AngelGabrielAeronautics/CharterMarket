import React from 'react';
import { View, Text } from 'react-native';

const App = () => {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red'}}>
      <Text style={{fontSize: 30, color: 'white', fontWeight: 'bold'}}>
        CHARTER TEST
      </Text>
      <Text style={{fontSize: 16, color: 'white', marginTop: 10}}>
        If you see this, our code is working!
      </Text>
    </View>
  );
};

export default App; 