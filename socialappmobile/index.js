import {LogBox } from "react-native";
LogBox.ignoreLogs([
  'Warning: MemoizedTNodeRenderer: Support for defaultProps will be removed from memo components in a future major release.',
  'Warning: TNodeChildrenRenderer: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.'
]);
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0].includes('defaultProps will be removed from function components')) {
    return;
  }
  originalConsoleError(...args);
};
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
