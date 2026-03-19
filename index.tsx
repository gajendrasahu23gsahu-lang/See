import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json'; // Make sure app.json exists with a "name" field

// Optional: Wrap with StrictMode for development checks
const Root = () => (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

AppRegistry.registerComponent(appName, () => Root);