import { useState, useEffect } from 'react'
import { getWallet, getTransactions } from '../api/wallet'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format } from 'date-fns'
import { FiDollarSign, FiLock } from 'react-icons/fi'

export default function WalletPage() {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, totalSpent: 0, locked: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, transRes] = await Promise.all([
          getWallet(),
          getTransactions({ page, limit: 10 }),
        ])
        setWallet(walletRes.data || { balance: 0, totalEarned: 0, totalSpent: 0, locked: 0 })
        setTransactions(transRes.data.transactions || transRes.data || [])
        setTotalPages(transRes.data.pagination?.pages || 1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FiDollarSign className="w-6 h-6 text-primary-500" /> Wallet
      </h1>

      {/* Balance */}
      <div className="card gradient-primary text-white text-center py-10">
        <p className="text-white/70 text-sm mb-2">Available Balance</p>
        <p className="text-5xl font-bold mb-2">{wallet.balance || 0}</p>
        <p className="text-white/70">Time Tokens</p>
      </div>

      {/* Locked Tokens */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <FiLock className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Locked in Escrow</p>
            <p className="text-2xl font-bold text-yellow-500">{wallet.locked || 0} tokens</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Held for active sessions</p>
            <p className="text-xs text-gray-400">Released after completion</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="text-sm">
                      <td className="py-3 text-gray-500 dark:text-gray-400">{format(new Date(tx.createdAt), 'MMM d, yyyy')}</td>
                      <td className="py-3 text-gray-900 dark:text-white">{tx.description || tx.type}</td>
                      <td className={`py-3 font-medium ${tx.amount > 0 ? 'text-accent-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} tokens
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'completed' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {tx.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-ghost text-sm py-1">Previous</button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-ghost text-sm py-1">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
