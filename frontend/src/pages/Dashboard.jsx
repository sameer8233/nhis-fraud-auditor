import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { claimsAPI } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const data = await claimsAPI.getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard metrics. Please ensure the backend is running.');
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const chartData = {
    labels: Object.keys(metrics.fraud_score_distribution || {}),
    datasets: [
      {
        label: 'Number of Claims',
        data: Object.values(metrics.fraud_score_distribution || {}),
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(251, 191, 36, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-600 uppercase mb-2">Total Claims</h3>
            <p className="text-3xl font-bold text-blue-900">{metrics.total_claims.toLocaleString()}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-sm font-semibold text-green-600 uppercase mb-2">Average Claim Amount</h3>
            <p className="text-3xl font-bold text-green-900">${parseFloat(metrics.average_claim_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h3 className="text-sm font-semibold text-red-600 uppercase mb-2">High-Risk Claims (Score &gt; 75)</h3>
            <p className="text-3xl font-bold text-red-900">
              {metrics.high_risk_claims_count.toLocaleString()}
              <span className="text-lg ml-2">({metrics.high_risk_claims_percentage}%)</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Fraud Score Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex justify-center">
              <div style={{ maxWidth: '400px', width: '100%' }}>
                <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            </div>
            <div className="flex justify-center">
              <div style={{ maxWidth: '400px', width: '100%' }}>
                <Bar 
                  data={chartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: true,
                        text: 'Claims by Risk Category'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Claims'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
