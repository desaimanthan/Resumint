'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface VoiceInterviewAgentProps {
  questions: string[]
  interviewTitle: string
  onTranscriptUpdate: (transcript: string) => void
  onInterviewComplete: (finalTranscript: string) => void
  onError: (error: string) => void
  onInterviewStart?: () => void
  apiCall: (endpoint: string, options?: any) => Promise<any>
}

interface RealtimeEvent {
  type: string
  [key: string]: any
}

export function VoiceInterviewAgent({
  questions,
  interviewTitle,
  onTranscriptUpdate,
  onInterviewComplete,
  onError,
  onInterviewStart,
  apiCall
}: VoiceInterviewAgentProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [transcript, setTranscript] = useState('')
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const [agentSpeaking, setAgentSpeaking] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  
  // Audio queue system to prevent overlapping
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Auto-scroll transcript to bottom
  const scrollToBottom = useCallback(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [])

  // Initialize audio context
  const initializeAudio = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        } 
      })
      mediaStreamRef.current = stream

      // Create audio context with 24kHz sample rate
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      
      // Create gain node for smooth audio transitions
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
      
      // Setup audio input processing
      setupAudioInput()
      
      return true
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      onError('Failed to access microphone. Please check permissions.')
      return false
    }
  }, [onError])

  // Stop current audio playback
  const stopCurrentAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch (error) {
        // Audio might already be stopped
      }
      currentSourceRef.current = null
    }
    audioQueueRef.current = []
    isPlayingRef.current = false
    setAgentSpeaking(false)
  }, [])

  // Setup audio input processing using ScriptProcessorNode
  const setupAudioInput = useCallback(() => {
    if (!audioContextRef.current || !mediaStreamRef.current || !wsRef.current) {
      console.log("Audio setup skipped - missing dependencies")
      return
    }

    try {
      // Create audio source from microphone
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current)
      
      // Create ScriptProcessorNode for audio processing (deprecated but reliable)
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
      scriptProcessorRef.current = processor
      
      // Connect source to processor
      source.connect(processor)
      processor.connect(audioContextRef.current.destination)
      
      // Handle audio processing
      processor.onaudioprocess = (event) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const input = event.inputBuffer.getChannelData(0) // mono
          const pcm16 = new Int16Array(input.length)
          
          // Convert to PCM16 using OpenAI's exact formula
          for (let i = 0; i < input.length; i++) {
            let s = Math.max(-1, Math.min(1, input[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }
          
          // Convert to bytes and base64
          const audioBytes = new Uint8Array(pcm16.buffer)
          const base64Audio = btoa(String.fromCharCode(...audioBytes))
          
          // Send to OpenAI
          wsRef.current.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio
          }))
        }
      }
      
      console.log("Audio input setup complete (ScriptProcessor)")
    } catch (error) {
      console.error("Failed to setup audio input:", error)
      onError("Failed to setup audio input processing")
    }
  }, [onError])

  // Play next audio chunk from queue sequentially
  const playNextAudioChunk = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      setAgentSpeaking(false)
      currentSourceRef.current = null
      return
    }

    isPlayingRef.current = true
    setAgentSpeaking(true)
    
    const audioData = audioQueueRef.current.shift()!
    
    try {
      // Decode base64 audio data
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Convert to audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(1, bytes.length / 2, 24000)
      const channelData = audioBuffer.getChannelData(0)
      
      // PCM16 decoding
      for (let i = 0; i < channelData.length; i++) {
        const sample = (bytes[i * 2] | (bytes[i * 2 + 1] << 8))
        channelData[i] = sample > 32767 ? (sample - 65536) / 32768 : sample / 32768
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      
      // Connect through gain node for smoother audio transitions
      if (gainNodeRef.current) {
        source.connect(gainNodeRef.current)
      } else {
        source.connect(audioContextRef.current.destination)
      }
      
      // Store reference to current source
      currentSourceRef.current = source
      
      source.start()
      
      // Play next chunk immediately when this one ends for seamless playback
      source.onended = () => {
        currentSourceRef.current = null
        // No delay - immediate transition for smooth speech
        playNextAudioChunk()
      }
      
    } catch (error) {
      console.error('Failed to play audio chunk:', error)
      currentSourceRef.current = null
      // Continue with next chunk even if this one fails
      setTimeout(() => {
        playNextAudioChunk()
      }, 200)
    }
  }, [])

  // Play audio chunk with queue to prevent overlap
  const playAudioChunk = useCallback((audioData: string) => {
    if (!audioContextRef.current) return

    // Add to queue
    audioQueueRef.current.push(audioData)
    
    // Start playing if not already playing
    if (!isPlayingRef.current) {
      playNextAudioChunk()
    }
  }, [playNextAudioChunk])

  // Connect to OpenAI Realtime API
  const connectToRealtimeAPI = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      // Get OpenAI API key from backend using apiCall
      const response = await apiCall('/mock-interviews/realtime-token', {
        method: 'POST'
      })

      const { token } = response

      // Connect to OpenAI Realtime API via WebSocket
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`,
        ['realtime', `openai-insecure-api-key.${token}`, 'openai-beta.realtime-v1']
      )

      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API')
        setIsConnected(true)
        setIsConnecting(false)
        
        // Call the interview start callback
        if (onInterviewStart) {
          onInterviewStart()
        }
        
        // Configure the session
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are a friendly and professional AI interview coach conducting a mock interview. Your voice should be warm, encouraging, and conversational - like talking to a supportive mentor.
            
            Interview Title: ${interviewTitle}
            
            You will ask the following questions one by one:
            ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
            
            SPEAKING GUIDELINES:
            - Speak at a moderately quick, efficient pace - like a professional interviewer
            - Use a warm, encouraging tone throughout
            - Vary your speech patterns to sound more human-like
            - Include natural conversational elements like "Great!", "I see", "That's interesting"
            - Wait for the user to finish speaking completely before responding
            - Take brief, natural pauses between thoughts - don't drag out sentences
            - Speak clearly and with good pronunciation
            - Sound like a real person having a genuine conversation, not a robot
            - Be efficient with your words while remaining warm and supportive
            
            Interview Flow:
            - Start with a warm greeting and brief explanation of the process
            - Ask questions one at a time, allowing full responses
            - Provide encouraging feedback after each answer ("That's a great example", "I appreciate your honesty", etc.)
            - Use transitional phrases between questions ("Let's move on to...", "Now I'd like to ask about...")
            - When complete, thank them warmly and provide encouraging closing remarks
            
            Remember: Sound like a real person having a genuine conversation with efficient, professional pacing - not a robot reading a script.`,
            voice: 'shimmer', // Natural female voice (supported by Realtime API)
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.8,
              prefix_padding_ms: 300,
              silence_duration_ms: 1500
            }
          }
        }))

        // Setup audio input after connection is established
        setupAudioInput()

        // Start the interview
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Hello! I\'m ready to start my mock interview. Please begin.'
            }]
          }
        }))

        ws.send(JSON.stringify({
          type: 'response.create'
        }))
      }

      ws.onmessage = (event) => {
        const data: RealtimeEvent = JSON.parse(event.data)
        handleRealtimeEvent(data)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionError('Connection error occurred')
        setIsConnected(false)
        setIsConnecting(false)
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
        setIsConnected(false)
        setIsConnecting(false)
        stopCurrentAudio()
      }

      wsRef.current = ws

    } catch (error) {
      console.error('Failed to connect to Realtime API:', error)
      setConnectionError('Failed to connect to voice service')
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected, questions, interviewTitle, apiCall, onInterviewStart, stopCurrentAudio, setupAudioInput])

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcribed
        const userText = event.transcript?.trim()
        if (userText) {
          console.log('User speech transcribed:', userText)
          setTranscript(prev => {
            const newTranscript = prev + (prev ? '\n\n' : '') + `👤 **You:** ${userText}`
            onTranscriptUpdate(newTranscript)
            setTimeout(scrollToBottom, 100)
            return newTranscript
          })
        }
        break

      case 'response.audio_transcript.delta':
        // AI response being generated
        const aiText = event.delta
        if (aiText) {
          setTranscript(prev => {
            const lines = prev.split('\n')
            const lastLine = lines[lines.length - 1]
            if (lastLine.startsWith('🤖 **AI Interviewer:**')) {
              lines[lines.length - 1] = lastLine + aiText
            } else {
              const separator = prev ? '\n\n' : ''
              lines.push(separator + '🤖 **AI Interviewer:** ' + aiText)
            }
            const newTranscript = lines.join('\n')
            onTranscriptUpdate(newTranscript)
            setTimeout(scrollToBottom, 100)
            return newTranscript
          })
        }
        break

      case 'response.audio_transcript.done':
        // AI response complete - transcript already updated in delta
        break

      case 'response.audio.delta':
        // Play audio chunk
        if (event.delta) {
          playAudioChunk(event.delta)
        }
        break

      case 'response.done':
        // Response complete - don't immediately set speaking to false
        // Let the audio queue finish playing
        break

      case 'input_audio_buffer.speech_started':
        setIsListening(true)
        // Stop current audio when user starts speaking
        stopCurrentAudio()
        break

      case 'input_audio_buffer.speech_stopped':
        setIsListening(false)
        break

      case 'error':
        console.error('Realtime API error:', event.error)
        onError(`Voice service error: ${event.error.message}`)
        break
    }
  }, [onTranscriptUpdate, onError, playAudioChunk, stopCurrentAudio, scrollToBottom])

  // Start interview
  const startInterview = useCallback(async () => {
    const audioInitialized = await initializeAudio()
    if (audioInitialized) {
      await connectToRealtimeAPI()
    }
  }, [initializeAudio, connectToRealtimeAPI])

  // End interview
  const endInterview = useCallback(() => {
    stopCurrentAudio()
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    onInterviewComplete(transcript)
  }, [transcript, onInterviewComplete, stopCurrentAudio])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio()
      
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopCurrentAudio])

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : connectionError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            Voice Interview Agent
          </CardTitle>
          <CardDescription>
            {isConnected 
              ? 'Connected - Ready for voice conversation'
              : isConnecting 
                ? 'Connecting to voice service...'
                : connectionError 
                  ? connectionError
                  : 'Ready to connect'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected && !isConnecting && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Voice Interview Experience:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Have a natural conversation with our AI interviewer</li>
                  <li>• Speak your answers naturally - no typing required</li>
                  <li>• Get real-time feedback and follow-up questions</li>
                  <li>• Complete transcript will be generated automatically</li>
                </ul>
              </div>
              
              <Button onClick={startInterview} size="lg" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Voice Interview
              </Button>
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>

                <div className="flex items-center gap-2">
                  {isListening && (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Listening...</span>
                    </div>
                  )}
                  {agentSpeaking && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm">AI Speaking...</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endInterview}
                >
                  <Square className="h-5 w-5 mr-2" />
                  End Interview
                </Button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interview Progress</span>
                  <span>{Math.round((currentQuestionIndex / questions.length) * 100)}% Complete</span>
                </div>
                <Progress value={(currentQuestionIndex / questions.length) * 100} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Transcript */}
      {isConnected && transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Live Transcript</CardTitle>
            <CardDescription>
              Real-time conversation transcript - automatically scrolls to latest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={transcriptRef}
              className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto scroll-smooth"
            >
              <div className="text-sm leading-relaxed space-y-3">
                {transcript.split('\n\n').map((message, index) => {
                  if (message.startsWith('👤 **You:**')) {
                    return (
                      <div key={index} className="flex gap-2">
                        <span className="text-blue-600 font-semibold">👤 You:</span>
                        <span className="text-gray-800">{message.replace('👤 **You:** ', '')}</span>
                      </div>
                    )
                  } else if (message.startsWith('🤖 **AI Interviewer:**')) {
                    return (
                      <div key={index} className="flex gap-2">
                        <span className="text-green-600 font-semibold">🤖 AI:</span>
                        <span className="text-gray-800">{message.replace('🤖 **AI Interviewer:** ', '')}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
