declare module 'ovenlivekit' {
  export interface OvenLiveKitOptions {
    url: string;
  }

  export interface Stream {
    id: string;
    mediaStream: MediaStream;
  }

  export type Publisher = any;
  export type Subscriber = any;

  export class OvenLiveKit {
    constructor(options: OvenLiveKitOptions);

    on(event: string, listener: (...args: any[]) => void): void;
    connect(): void;
    disconnect(): void;

    joinRoom(roomId: string, name: string): Promise<void>;

    publish(stream: MediaStream): void;
    unpublish(): void;
  }

  // Default export is a constructor-compatible value for OvenLiveKit
  const _default: {
    new (options: OvenLiveKitOptions): OvenLiveKit;
  };
  export default _default;
}
