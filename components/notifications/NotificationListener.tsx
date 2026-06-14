"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getPusherClient } from "@/lib/pusher-client"

interface NotificationListenerProps {
  userId: string
}

// Create a soft notification sound using Web Audio API
// No external files needed — generated programmatically
function playNotificationSound() {
  try {
    const audioContext = new AudioContext()

    // Create two oscillators for a pleasant two-tone chime
    const frequencies = [587.33, 880] // D5 and A5 — pleasant chord

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = "sine" // sine = smooth, soft sound
      oscillator.frequency.value = freq

      const startTime = audioContext.currentTime + index * 0.15

      // Fade in
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)

      // Fade out — creates the "chime" effect
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.6)
    })
  } catch (error) {
    // Silently fail — sound is not critical
    console.warn("Could not play notification sound:", error)
  }
}

export default function NotificationListener({
  userId,
}: NotificationListenerProps) {
  const router = useRouter()

  useEffect(() => {
    // getPusherClient() is called INSIDE useEffect
    // useEffect only runs in the browser — so window always exists here
    const pusherClient = getPusherClient()

    const channel = pusherClient.subscribe(`user-${userId}`)

    channel.bind("new-notification", () => {
        // Play sound first, then refresh UI
      playNotificationSound()
      router.refresh()
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`user-${userId}`)
    }
  }, [userId, router])

  return null
}