import { useState, useRef, useEffect, useCallback } from 'react'
import VideoControls from './VideoControls'

export default function VideoCall({ isOpen, onClose, sessionInfo, socket }) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [duration, setDuration] = useState(0)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const timerRef = useRef(null)

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      peerConnectionRef.current = pc

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { candidate: event.candidate, sessionId: sessionInfo?.id })
        }
      }

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0])
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
      }

      if (socket) {
        socket.on('offer', async (data) => {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('answer', { answer, sessionId: sessionInfo?.id })
        })

        socket.on('answer', async (data) => {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        })

        socket.on('ice-candidate', async (data) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
          } catch (e) { /* ignore */ }
        })
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      if (socket) {
        socket.emit('offer', { offer, sessionId: sessionInfo?.id })
      }
    } catch (err) {
      console.error('Failed to start call:', err)
    }
  }, [socket, sessionInfo])

  useEffect(() => {
    if (isOpen) {
      startCall()
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    }
    return () => {
      localStream?.getTracks().forEach((t) => t.stop())
      peerConnectionRef.current?.close()
      if (timerRef.current) clearInterval(timerRef.current)
      setDuration(0)
    }
  }, [isOpen])

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = isMuted })
    setIsMuted(!isMuted)
  }

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = isCameraOff })
    setIsCameraOff(!isCameraOff)
  }

  const endCall = () => {
    localStream?.getTracks().forEach((t) => t.stop())
    peerConnectionRef.current?.close()
    onClose()
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-lg">
        <p className="text-sm font-medium">{sessionInfo?.skillName || 'Video Session'}</p>
        <p className="text-xs opacity-75">{formatDuration(duration)}</p>
      </div>

      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <p>Waiting for participant...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-48 h-36 lg:w-64 lg:h-48 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>

      <VideoControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onEndCall={endCall}
        duration={formatDuration(duration)}
      />
    </div>
  )
}
