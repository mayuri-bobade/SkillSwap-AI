import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi'

export default function VideoControls({ isMuted, isCameraOff, onToggleMute, onToggleCamera, onEndCall, duration }) {
  return (
    <div className="p-6 flex items-center justify-center gap-4 bg-gray-900">
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-colors ${
          isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        } text-white`}
      >
        {isMuted ? <FiMicOff className="w-6 h-6" /> : <FiMic className="w-6 h-6" />}
      </button>
      <button
        onClick={onToggleCamera}
        className={`p-4 rounded-full transition-colors ${
          isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        } text-white`}
      >
        {isCameraOff ? <FiVideoOff className="w-6 h-6" /> : <FiVideo className="w-6 h-6" />}
      </button>
      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
      >
        <FiPhoneOff className="w-6 h-6" />
      </button>
    </div>
  )
}
