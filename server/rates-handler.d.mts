import type { IncomingMessage, ServerResponse } from 'node:http'

export function handleRatesRequest(request: IncomingMessage, response: ServerResponse, appId?: string): Promise<void>
