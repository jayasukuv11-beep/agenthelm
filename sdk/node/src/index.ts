export { AgentHelm, AgentHelm as Agent, connect } from './client'
export type {
  AgentHelmOptions,
  TrackTokensOptions,
  LogLevel,
  CommandHandler,
  ChatHandler,
} from './client'
export { OfflineQueue } from './queue'
export type { QueueItem } from './queue'

// Package version
export const VERSION = '1.0.3'
