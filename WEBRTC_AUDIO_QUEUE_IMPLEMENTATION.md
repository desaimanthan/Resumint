# WebRTC Audio Queue Implementation Plan

## Current Issues
1. **Audio Overlap**: Multiple audio chunks playing simultaneously
2. **Speech Speed**: Too fast for comfortable listening
3. **WebSocket Limitations**: Current WebSocket approach has latency issues

## OpenAI's WebRTC Recommendation

OpenAI suggests using WebRTC instead of WebSocket for client-side applications because:
- **Lower Latency**: Direct peer-to-peer connection
- **Better Audio Quality**: Native audio handling
- **Reduced Overlap**: Built-in audio stream management

## Immediate Fix: Audio Queue System

Since WebRTC implementation would be a major change, let's first implement a proper audio queue system:

### Current Problem in playAudioChunk:
```javascript
// PROBLEM: Each chunk plays immediately, causing overlap
source.start() // Multiple sources start at same time
```

### Solution: Sequential Audio Queue
```javascript
// SOLUTION: Queue chunks and play one at a time
const audioQueue = []
let isPlaying = false

function playAudioChunk(audioData) {
  audioQueue.push(audioData)
  if (!isPlaying) {
    playNextChunk()
  }
}

function playNextChunk() {
  if (audioQueue.length === 0) {
    isPlaying = false
    return
  }
  
  isPlaying = true
  const audioData = audioQueue.shift()
  
  // Play this chunk
  // When it ends, call playNextChunk() again
}
```

## Implementation Steps

### Step 1: Fix Audio Queue (Immediate)
- Replace current `playAudioChunk` function
- Add sequential playback with delays
- Prevent overlapping audio sources

### Step 2: Consider WebRTC Migration (Future)
- Research OpenAI's WebRTC implementation
- Compare benefits vs current WebSocket approach
- Plan migration strategy if beneficial

## Code Changes Needed

### 1. Audio Queue Management
```javascript
// Add to refs
const audioQueueRef = useRef<string[]>([])
const isPlayingRef = useRef(false)
const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)

// New playAudioChunk function
const playAudioChunk = useCallback((audioData: string) => {
  audioQueueRef.current.push(audioData)
  if (!isPlayingRef.current) {
    playNextAudioChunk()
  }
}, [])

// New sequential playback function
const playNextAudioChunk = useCallback(() => {
  if (audioQueueRef.current.length === 0) {
    isPlayingRef.current = false
    setAgentSpeaking(false)
    return
  }

  isPlayingRef.current = true
  setAgentSpeaking(true)
  
  const audioData = audioQueueRef.current.shift()!
  
  // Decode and play audio
  // Add 100ms delay between chunks
  // Call playNextAudioChunk() when finished
}, [])
```

### 2. Enhanced Error Handling
```javascript
// Stop current audio if needed
const stopCurrentAudio = useCallback(() => {
  if (currentSourceRef.current) {
    currentSourceRef.current.stop()
    currentSourceRef.current = null
  }
  audioQueueRef.current = []
  isPlayingRef.current = false
  setAgentSpeaking(false)
}, [])
```

### 3. Cleanup on Component Unmount
```javascript
useEffect(() => {
  return () => {
    stopCurrentAudio()
    // ... other cleanup
  }
}, [])
```

## Expected Results

### Before Fix:
- Multiple audio chunks play simultaneously
- Words overlap and sound garbled
- Fast, robotic speech

### After Fix:
- One audio chunk plays at a time
- Clear, sequential speech
- 100ms delays prevent overlap
- More natural conversation flow

## WebRTC Future Consideration

If audio quality issues persist, we should consider migrating to WebRTC:

### Benefits:
- Native audio stream handling
- Lower latency
- Better quality
- Built-in audio management

### Challenges:
- More complex implementation
- Different API structure
- Need to research OpenAI's WebRTC docs

## Next Steps

1. **Immediate**: Implement audio queue system
2. **Test**: Verify no more overlapping audio
3. **Evaluate**: If issues persist, research WebRTC migration
4. **Document**: Update implementation guides

This approach gives us an immediate fix while keeping the door open for WebRTC migration if needed.
