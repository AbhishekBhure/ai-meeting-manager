import PusherClient from "pusher-js"

let client: PusherClient | null = null

// Lazy singleton — only created in the browser, never on the server
export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    throw new Error("Pusher client can only be used in the browser")
  }

  if (!client) {
    client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }

  return client
}