import {LogBox } from "react-native";
LogBox.ignoreLogs([
  'Warning: MemoizedTNodeRenderer: Support for defaultProps will be removed from memo components in a future major release.'
]);
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
