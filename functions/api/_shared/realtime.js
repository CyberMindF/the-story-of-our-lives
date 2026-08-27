const ROOM_NAME = "world";

// Helper intenzionalmente non ancora usato: ogni flusso verra' abilitato esplicitamente.
export async function notifyRealtime(env, event) {
  if (!env.REALTIME) return 0;

  try {
    const room = env.REALTIME.getByName(ROOM_NAME);
    return await room.broadcast({
      ...event,
      occurredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "realtime_notify_error",
      message: error instanceof Error ? error.message : "Unknown realtime error"
    }));
    return 0;
  }
}
