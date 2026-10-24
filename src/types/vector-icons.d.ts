// Minimal typings for the one icon set the app uses.
// (react-native-vector-icons v10 does not ship its own .d.ts files.)
declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type {ComponentType} from 'react';
  import type {StyleProp, TextStyle} from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    testID?: string;
  }

  const Icon: ComponentType<IconProps>;
  export default Icon;
}
