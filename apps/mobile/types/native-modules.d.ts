declare module "expo-device" {
  export const isDevice: boolean;
}

declare module "@react-native-community/netinfo" {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }

  const NetInfo: {
    fetch(): Promise<NetInfoState>;
    addEventListener(listener: (state: NetInfoState) => void): () => void;
  };

  export default NetInfo;
}
