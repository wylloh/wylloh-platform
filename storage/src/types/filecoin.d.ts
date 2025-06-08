declare module '@filecoin-shipyard/lotus-client-provider-nodejs' {
  export function HttpProvider(url: string): any;
  export function WsProvider(url: string): any;
}

declare module '@filecoin-shipyard/lotus-client-schema' {
  export const methods: any;
  export const LotusRPC: any;
} 