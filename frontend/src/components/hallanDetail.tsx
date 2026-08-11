import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Customer {
  customerName: string;
  businessName?: string;
  mobileNumber?: string;
  address?: string;
}

interface User {
  name: string;
  email: string;
}

interface ChallanItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  subtotal: number;
}

interface Challan {
  id: string;
  challanNumber: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  createdAt: string;
  customer: Customer;
  user: User;
  items: ChallanItem[];
}

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch single challan details
  const fetchChallanDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load challan details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallanDetail();
  }, [id]);

  // Download PDF stream
  const handleDownloadPDF = async () => {
    if (!challan) return;
    try {
      setActionLoading(true);
      const response = await axios.get(`/api/challans/${challan.id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan-${challan.challanNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Error downloading PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Change (Confirm/Cancel)
  const handleStatusUpdate = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
    if (!challan) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(`/api/challans/${challan.id}/status`, { status: newStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchChallanDetail();
      }
    } catch (err: any) {
      console.error('Status update failed:', err);
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Challan Details...</div>;
  }

  if (!challan) {
    return (
      <div className="p-8 text-center text-red-500">
        Delivery Challan not found.{' '}
        <button onClick={() => navigate(-1)} className="underline font-semibold ml-2">
          Go Back
        </button>
      </div>
    );
  }

  const grandTotal = challan.items.reduce(
    (sum, item) => sum + Number(item.subtotal || item.unitPriceSnapshot * item.quantity),
    0
  );

  return (
    <div className="max-w-4xl mx-auto p-6 my-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header Bar */}
      <div className="flex justify-between items-start border-b pb-4 mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-blue-600 hover:underline mb-2 block font-medium"
          >
            ← Back to Challan List
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{challan.challanNumber}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Issued on: {new Date(challan.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              challan.status === 'CONFIRMED'
                ? 'bg-green-100 text-green-800'
                : challan.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {challan.status}
          </span>

          <div className="flex gap-2 mt-2">
            {challan.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusUpdate('CONFIRMED')}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                Confirm & Dispatch
              </button>
            )}

            {challan.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded hover:bg-red-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Customer & Creator Info */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Consignee (Customer)</h3>
          <p className="font-medium text-gray-900">{challan.customer.customerName}</p>
          {challan.customer.businessName && (
            <p className="text-gray-600">{challan.customer.businessName}</p>
          )}
          {challan.customer.mobileNumber && (
            <p className="text-gray-500 text-xs">Contact: {challan.customer.mobileNumber}</p>
          )}
          {challan.customer.address && (
            <p className="text-gray-500 text-xs mt-1">{challan.customer.address}</p>
          )}
        </div>

        <div className="text-right">
          <h3 className="font-semibold text-gray-700 mb-1">Issued By</h3>
          <p className="font-medium text-gray-900">{challan.user?.name || 'System User'}</p>
          <p className="text-gray-500 text-xs">{challan.user?.email}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b text-gray-500 uppercase text-xs">
              <th className="py-2">SKU</th>
              <th className="py-2">Product Description</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Quantity</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 font-mono text-xs text-gray-500">{item.skuSnapshot || '-'}</td>
                <td className="py-3 font-medium text-gray-800">{item.productNameSnapshot}</td>
                <td className="py-3 text-right">₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                <td className="py-3 text-right font-semibold">{item.quantity}</td>
                <td className="py-3 text-right font-medium">
                  ₹{Number(item.subtotal || item.unitPriceSnapshot * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="border-t pt-4 flex justify-between items-center text-sm font-semibold text-gray-800">
        <div>Total Items Dispatched: {challan.totalQuantity} units</div>
        <div className="text-lg text-blue-900">Grand Total: ₹{grandTotal.toFixed(2)}</div>
      </div>
    </div>
  );
};