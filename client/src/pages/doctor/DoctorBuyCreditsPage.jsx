import { useState, useEffect } from 'react';
import { Coins, ArrowLeft, CheckCircle, Clock, CreditCard, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function DoctorBuyCreditsPage() {
  const navigate = useNavigate();
  const { user, updateCredits } = useAuthStore();
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    axiosInstance.get('/payment/history')
      .then(res => setPaymentHistory(res.data || []))
      .catch(() => { })
      .finally(() => setLoadingHistory(false));
  }, []);

  const presetAmounts = [500, 1000, 2000, 5000];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyCredits = async () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setLoading(true);

    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axiosInstance.post('/payment/razorpay/order', { amount });
      if (!data.success) {
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'MediCore',
        description: 'Doctor Credit Purchase',
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axiosInstance.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount
            });
            if (verifyRes.data.success) {
              setSubmitted(true);
              toast.success('Payment confirmed! Credit request sent to admin.');
              axiosInstance.get('/payment/history').then(res => setPaymentHistory(res.data || []));
            }
          } catch (error) {
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#0d9488' }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="absolute inset-0 rounded-3xl border-2 border-green-300 animate-ping opacity-30" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Confirmed! 🎉</h2>
          <p className="text-sm text-slate-500 mb-2">
            Your payment of <strong>₹{amount}</strong> has been verified via Razorpay.
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-4">
            ⏳ Credit request sent to admin for approval. Credits will be added once admin confirms.
          </p>
          <div className="space-y-3">
            <Button onClick={() => { setSubmitted(false); setAmount(500); }} className="w-full">Buy More Credits</Button>
            <Button onClick={() => navigate('/doctor')} variant="outline" className="w-full">Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Buy Credits</h1>
        <p className="text-sm text-slate-500">Purchase credits to pay your monthly ₹500 platform fee and manage withdrawals</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-accent-600 to-primary-500 rounded-2xl p-5 text-white animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-accent-100 text-xs">Current Credit Balance</p>
            <p className="text-3xl font-bold">₹{user?.credits || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Shield className="w-4 h-4 text-accent-200" />
          <p className="text-accent-100 text-xs">
            Platform Fee: ₹500/month • Subscription Status: <span className="font-bold text-white">{user?.subscriptionStatus === 'paid' ? '✅ Active' : '❌ Unpaid'}</span>
          </p>
        </div>
      </div>

      {/* Select Amount */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-500" /> Select Amount
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presetAmounts.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${amount === a
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Custom Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <Button
          onClick={handleBuyCredits}
          loading={loading}
          size="lg"
          className="w-full flex items-center justify-center gap-2 mb-2"
        >
          <Zap className="w-5 h-5" /> Pay ₹{amount} via Razorpay
        </Button>
        <p className="text-xs text-center text-slate-500">
          Payment will be verified instantly. Admin will approve and add credits (10% processing fee applies).
        </p>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4">Payment History</h3>
        {loadingHistory ? (
          <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
        ) : paymentHistory.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No payment history yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {paymentHistory.slice(0, 20).map((p) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.status === 'completed' ? 'bg-green-50 text-green-600' :
                    p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                    {p.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.description || p.type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">₹{p.amount}</p>
                  <p className={`text-xs font-medium ${p.status === 'completed' ? 'text-green-600' :
                    p.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    {p.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
