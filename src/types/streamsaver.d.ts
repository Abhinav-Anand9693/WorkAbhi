declare module "streamsaver" {
  interface StreamSaverOptions {
    size?: number;
    writableStrategy?: QueuingStrategy;
    readableStrategy?: QueuingStrategy;
  }

  interface StreamSaver {
    createWriteStream(
      filename: string,
      options?: StreamSaverOptions,
    ): WritableStream<Uint8Array>;

    mitm?: string;

    supported?: boolean;
  }

  const streamSaver: StreamSaver;

  export default streamSaver;
}