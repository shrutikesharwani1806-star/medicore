import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Clock, DollarSign, Upload, Image, CreditCard, Activity, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import useAuthStore from '../../store/useAuthStore';
import useDoctorStore from '../../store/useDoctorStore';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function CreditsManagementPage() {
  const { user } = useAuthStore();
  const { doctors, fetchAdminDoctors } = useDoctorStore();
  const [qrCode, setQrCode] = useState(user?.adminQrCode || '');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [adminEarnings, setAdminEarnings] = useState({ totalEarnings: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAdminDoctors();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, earningsRes, qrRes, withdrawalsRes] = await Promise.all([
        axiosInstance.get('/payment/pending'),
        axiosInstance.get('/payment/admin-earnings'),
        axiosInstance.get('/payment/qr-code'),
        axiosInstance.get('/payment/withdrawals/pending'),
      ]);
      setPendingPayments(pendingRes.data || []);
      setPendingWithdrawals(withdrawalsRes.data || []);
      setAdminEarnings(earningsRes.data || { totalEarnings: 0, transactions: [] });
      if (qrRes.data?.qrCode) setQrCode(qrRes.data.qrCode);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        const res = await axiosInstance.put('/payment/upload-qr', { qrCode: reader.result });
        setQrCode(reader.result);
        toast.success('QR code uploaded successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to upload QR code');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAmountChange = (id, val) => {
    setCustomAmounts(prev => ({ ...prev, [id]: val }));
  };

  const handleApprove = async (paymentId, userName) => {
    try {
      const customAmount = customAmounts[paymentId];
      await axiosInstance.put(`/payment/approve/${paymentId}`, { customAmount });
      toast.success(`Credits added to ${userName}'s account!`);
      // Refresh
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleWithdrawalUpdate = async (withdrawalId, status, doctorName) => {
    try {
      await axiosInstance.put(`/payment/withdrawal/${withdrawalId}`, { status });
      toast.success(`Withdrawal ${status} for ${doctorName}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Payment & Earnings Dashboard</h1>
        <p className="text-sm text-slate-500">Track earnings, manage credit approvals, and monitor doctor subscriptions</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid sm:grid-cols-4 gap-4 animate-slide-up">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <DollarSign className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-green-100 text-xs">Total Earnings</p>
          <p className="text-3xl font-bold">₹{adminEarnings.totalEarnings}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <CreditCard className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-xs">10% Credit Fees</p>
          <p className="text-3xl font-bold">₹{adminEarnings.breakdown?.creditFees || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
          <Calendar className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-purple-100 text-xs">Consultation Share</p>
          <p className="text-3xl font-bold">₹{adminEarnings.breakdown?.consultationShares || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
          <Activity className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-xs">Doctor Subscriptions</p>
          <p className="text-3xl font-bold">₹{adminEarnings.breakdown?.subscriptions || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary-500" /> Payment QR Code
          </h3>
          {qrCode ? (
            <div className="text-center mb-4">
              <img src={qrCode} alt="Admin QR" className="w-40 h-40 mx-auto rounded-xl border border-slate-200 bg-white p-2" />
              <p className="text-xs text-slate-500 mt-2">Current QR code shown to patients</p>
            </div>
          ) : (
            <div className="text-center py-6 mb-4">
              <Image className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No QR code uploaded yet</p>
            </div>
          )}
          <label className="block">
            <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              icon={Upload}
              loading={uploading}
              onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
            >
              {qrCode ? 'Update QR Code' : 'Upload QR Code'}
            </Button>
          </label>
        </div>

        {/* Pending Credit Approvals */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Credit Requests
            {pendingPayments.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse-soft">
                {pendingPayments.length}
              </span>
            )}
          </h3>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
          ) : pendingPayments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No pending credit requests</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingPayments.map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                  <img
                    src={p.userId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.userId?.name}`}
                    alt={p.userId?.name}
                    className="w-10 h-10 rounded-xl bg-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{p.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{p.userId?.email} • {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                      <span className="text-xs text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        className="w-14 text-sm font-bold text-slate-700 focus:outline-none bg-transparent" 
                        defaultValue={p.amount}
                        onChange={(e) => handleAmountChange(p._id, e.target.value)}
                        title="Edit amount to approve"
                      />
                    </div>
                    <button
                      onClick={() => handleApprove(p._id, p.userId?.name)}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all cursor-pointer shadow-sm border border-green-100"
                      title="Approve and Update Credits"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '170ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-purple-500" /> Pending Doctor Withdrawals
          {pendingWithdrawals.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold animate-pulse-soft">
              {pendingWithdrawals.length}
            </span>
          )}
        </h3>
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
        ) : pendingWithdrawals.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No pending withdrawals</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {pendingWithdrawals.map((w) => (
              <div key={w._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                <img
                  src={w.userId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${w.userId?.name}`}
                  alt={w.userId?.name}
                  className="w-10 h-10 rounded-xl bg-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{w.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{w.userId?.email} • {new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {w.userId?.qrCode ? (
                    <div className="group/qr relative">
                      <img
                        src={w.userId.qrCode}
                        alt="Doctor QR"
                        className="w-10 h-10 rounded-lg border border-slate-200 bg-white p-0.5 cursor-zoom-in hover:scale-110 transition-transform"
                      />
                      <div className="hidden group-hover/qr:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-white p-2 rounded-xl shadow-2xl border border-slate-100 min-w-[200px] animate-slide-up">
                        <img src={w.userId.qrCode} alt="Expanded QR" className="w-full aspect-square rounded-lg mb-2" />
                        <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-wider">Scan to Pay Dr. {w.userId.name}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">NO QR</span>
                  )}
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">₹{w.amount}</span>
                  <button
                    onClick={() => handleWithdrawalUpdate(w._id, 'completed', w.userId?.name)}
                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all cursor-pointer"
                    title="Mark Paid"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleWithdrawalUpdate(w._id, 'failed', w.userId?.name)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all cursor-pointer text-xs font-medium"
                    title="Reject"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4">Recent Admin Transactions</h3>
        {adminEarnings.transactions?.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">From</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">Type</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">Date</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(adminEarnings.transactions || []).slice(0, 15).map((t) => (
                  <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{t.userId?.name || 'N/A'}</td>
                    <td className="px-4 py-2.5">
                      <Badge status={t.type === 'booking_fee' ? 'pending' : 'confirmed'}>{t.type?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-green-600">₹{t.amount}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge status={t.status === 'completed' ? 'confirmed' : t.status}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
