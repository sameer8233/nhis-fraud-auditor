import { useState, useEffect } from 'react';
import { claimsAPI } from '../services/api';

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState({
    search: '',
    diagnosis: '',
    patient_id: '',
    provider_id: '',
    min_score: '',
    max_score: '',
  });

  useEffect(() => {
    fetchClaims();
  }, [currentPage, filters]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      };
      const data = await claimsAPI.getClaims(params);
      setClaims(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20));
      setError(null);
    } catch (err) {
      setError('Failed to load claims. Please ensure the backend is running.');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClaims();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      diagnosis: '',
      patient_id: '',
      provider_id: '',
      min_score: '',
      max_score: '',
    });
    setCurrentPage(1);
  };

  const getRiskBadgeClass = (score) => {
    if (score <= 25) return 'bg-green-100 text-green-800';
    if (score <= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLevel = (score) => {
    if (score <= 25) return 'Low';
    if (score <= 75) return 'Medium';
    return 'High';
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Claims Review</h2>

        <form onSubmit={handleSearch} className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search claims..."
              value={filters.search}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              name="diagnosis"
              placeholder="Diagnosis Code"
              value={filters.diagnosis}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              name="patient_id"
              placeholder="Patient ID"
              value={filters.patient_id}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="provider_id"
              placeholder="Provider ID"
              value={filters.provider_id}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="number"
              name="min_score"
              placeholder="Min Fraud Score"
              value={filters.min_score}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="number"
              name="max_score"
              placeholder="Max Fraud Score"
              value={filters.max_score}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading claims...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {claims.length} of {totalCount} claims
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Claim ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Patient ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Provider ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Diagnosis</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Claim Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fraud Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{claim.claim_id}</td>
                      <td className="px-4 py-3 text-sm">{claim.patient_id}</td>
                      <td className="px-4 py-3 text-sm">{claim.provider_id}</td>
                      <td className="px-4 py-3 text-sm">{claim.diagnosis_code}</td>
                      <td className="px-4 py-3 text-sm font-semibold">${parseFloat(claim.claim_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">{claim.claim_date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-bold text-lg">{claim.fraud_score}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(claim.fraud_score)}`}>
                          {getRiskLevel(claim.fraud_score)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <span className="text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
