export type Constructor<T> = new (...args: any[]) => T;

export interface Spawnable {
  spawn(cmd: string, args?: any[], opt?: any): Promise<Uint8Array>;
}
