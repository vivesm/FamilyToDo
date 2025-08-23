// Utility function to emit updates to all connected clients
export function emitUpdate(io, event, data) {
  if (io) {
    io.to('family-room').emit(event, data);
    console.log(`Emitted ${event} to family-room`);
  }
}