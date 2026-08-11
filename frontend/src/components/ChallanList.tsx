import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ChallanItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
}

interface Customer {
  id: string;
  customerName: string;
  businessName?: string;
}

interface Challan {
  id: string;
  challanNumber: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  createdAt: string;
  customer: Customer;
  items: ChallanItem[];
}

export const ChallanList: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch Challans on component mount
  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/challans');
      if (res.data.success) {
        setChallans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  // Handle PDF Stream & Download
  const handleDownloadPDF = async (id: string, challanNumber: string) => {
    try {
      setDownloadingId(id);
      const response = await axios.get(`/api/challans/${id}/pdf`, {
        responseType: 'blob', // Crucial for receiving binary PDF streams
      });

      // Create a temporary Blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan-${challanNumber}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up link object
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Error generating or downloading PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Status Transition (e.g. DRAFT -> CONFIRMED)
  const handleStatusUpdate = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await axios.patch(`/api/challans/${id}/status`, { status: newStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchChallans(); // Refresh table state
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      alert(err.response?.data?.message || 'Failed to update challan status.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading Delivery Challans...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Delivery Challans</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
              <th className="p-3">Challan No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total Qty</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {challans.map((challan) => (
              <tr key={challan.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-blue-600">{challan.challanNumber}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-800">{challan.customer.customerName}</div>
                  {challan.customer.businessName && (
                    <div className="text-xs text-gray-400">{challan.customer.businessName}</div>
                  )}
                </td>
                <td className="p-3 text-gray-500">
                  {new Date(challan.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-gray-700">{challan.totalQuantity} pcs</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      challan.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : challan.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {challan.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {/* Status Actions */}
                  {challan.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusUpdate(challan.id, 'CONFIRMED')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                    >
                      Confirm & Dispatch
                    </button>
                  )}

                  {challan.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleStatusUpdate(challan.id, 'CANCELLED')}
                      className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition"
                    >
                      Cancel
                    </button>
                  )}

                  {/* PDF Download Button */}
                  <button
                    onClick={() => handleDownloadPDF(challan.id, challan.challanNumber)}
                    disabled={downloadingId === challan.id}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {downloadingId === challan.id ? 'Downloading...' : 'PDF'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};