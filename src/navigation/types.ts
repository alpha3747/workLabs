import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  TaskDetail: {taskId: string};
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    // Gives useNavigation() typed routes everywhere.
    interface RootParamList extends RootStackParamList {}
  }
}
