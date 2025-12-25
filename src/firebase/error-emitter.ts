import { EventEmitter } from 'events';

// A simple event emitter to broadcast errors across the application.
// This allows components to listen for specific errors and react accordingly.
export const errorEmitter = new EventEmitter();
