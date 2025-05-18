import Bull from 'bull';

declare module 'bull' {
  interface QueueOptions {
    redis?: {
      port?: number;
      host?: string;
      password?: string;
      maxRetriesPerRequest?: number;
      enableReadyCheck?: boolean;
    };
    defaultJobOptions?: {
      attempts?: number;
      backoff?: {
        type: 'exponential' | 'fixed';
        delay: number;
      };
      removeOnComplete?: boolean;
      removeOnFail?: boolean;
      timeout?: number;
    };
  }

  interface Queue {
    on(event: string, callback: Function): void;
    process(concurrency: number, callback: (job: Job) => Promise<any>): void;
    add<T>(data: T, options?: JobOptions): Promise<Job<T>>;
    pause(isLocal?: boolean): Promise<void>;
    close(): Promise<void>;
    getWaitingCount(): Promise<number>;
    getActiveCount(): Promise<number>;
    getCompletedCount(): Promise<number>;
    getFailedCount(): Promise<number>;
    getDelayedCount(): Promise<number>;
  }

  interface Job<T = any> {
    id: string;
    data: T;
  }

  interface JobOptions {
    priority?: number;
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    timeout?: number;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  }
} 