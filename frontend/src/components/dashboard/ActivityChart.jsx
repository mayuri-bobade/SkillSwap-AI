import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ActivityChart({ data }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const taughtData = data?.taught || [4, 6, 3, 8, 5, 7, 9, 6, 8, 10, 7, 11]
  const learnedData = data?.learned || [2, 4, 5, 3, 6, 4, 5, 7, 4, 6, 8, 5]

  const tickColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  const legendColor = isDark ? 'rgba(255,255,255,0.8)' : undefined

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Skills Taught',
        data: taughtData,
        backgroundColor: 'rgba(124, 58, 237, 0.8)',
        borderRadius: 6,
        barThickness: 16,
      },
      {
        label: 'Skills Learned',
        data: learnedData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, padding: 20, color: legendColor },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor } },
      x: { grid: { display: false }, ticks: { color: tickColor } },
    },
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Overview</h3>
      <div className="h-72">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
