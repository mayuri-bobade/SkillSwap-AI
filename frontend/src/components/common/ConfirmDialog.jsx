import Modal from './Modal'
import { FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'} flex items-center justify-center mb-4`}>
          <FiAlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-primary-500'}`} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
