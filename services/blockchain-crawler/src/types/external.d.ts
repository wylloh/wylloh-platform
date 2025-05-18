declare module 'kafkajs' {
  export class Kafka {
    constructor(config: { clientId: string; brokers: string[] });
    producer(): Producer;
    consumer(config: { groupId: string }): Consumer;
  }

  export class Producer {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(config: { topic: string; messages: { key: string; value: string }[] }): Promise<void>;
  }

  export class Consumer {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(config: { topic: string; fromBeginning: boolean }): Promise<void>;
    run(config: { eachMessage: (payload: { message: { value: Buffer | null } }) => Promise<void> }): Promise<void>;
  }
}

declare module 'bull' {
  export default class Queue {
    constructor(name: string, config: { redis: { host: string; port: number; password?: string } });
    process(handler: (job: { data: any }) => Promise<any>): void;
    add(data: any, options?: { attempts: number; backoff: { type: string; delay: number } }): Promise<void>;
    close(): Promise<void>;
  }
}

declare module '@elastic/elasticsearch' {
  export class Client {
    constructor(config: { node: string; auth?: { username: string; password: string } });
    ping(): Promise<void>;
    bulk(params: { operations: any[] }): Promise<void>;
  }
}

declare module 'ioredis' {
  export default class Redis {
    constructor(config: { host: string; port: number; password?: string });
    quit(): Promise<void>;
  }
} 