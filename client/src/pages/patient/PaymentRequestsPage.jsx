import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Clock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import usePaymentStore from '../../store/usePaymentStore';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PaymentRequestsPage() {
    const { paymentRequests, fetchPaymentRequests, payRequest, loading } = usePaymentStore();
    const { user, updateCredits } = useAuthStore();
    const navigate = useNavigate();
    const [payingId, setPayingId] = useState(null);

    useEffect(() => {
        fetchPaymentRequests();
    }, []);

    const handlePay = async (request) => {
        if (user.credits < request.amount) {
            toast.error(`Insufficient credits! You need ₹${request.amount}. Current balance: ₹${user.credits}`);
            navigate('/patient/buy-credits');
            return;
        }

        setPayingId(request._id);
        try {
            const res = await payRequest(request.appointmentId?._id);
            if (res.creditsRemaining !== undefined) {
                updateCredits(res.creditsRemaining);
            }
            toast.success('Payment completed successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="animate-slide-up">
                <h1 className="text-2xl font-bold text-slate-800 mb-1">Payment Requests</h1>
                <p className="text-sm text-slate-500">Pending payments for your completed consultations</p>
            </div>

            {/* Credit Balance Card */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-100 animate-slide-up">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-primary-100 text-sm font-medium mb-1">Your Balance</p>
                        <h2 className="text-3xl font-bold">₹{user?.credits?.toLocaleString() || 0}</h2>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                        onClick={() => navigate('/patient/buy-credits')}
                    >
                        Recharge Credits
                    </Button>
                </div>
            </div>

            {loading && paymentRequests.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : paymentRequests.length === 0 ? (
                <EmptyState
                    icon={CheckCircle2}
                    title="No pending payments"
                    description="You are all caught up! All your completed consultations are paid for."
                />
            ) : (
                <div className="grid gap-4">
                    {paymentRequests.map((req, i) => (
                        <div
                            key={req._id}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all animate-slide-up"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                                    <User className="w-7 h-7 text-primary-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 text-lg">Dr. {req.receiverId?.name}</h3>
                                    <p className="text-primary-600 text-sm font-medium mb-2">{req.receiverId?.category}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            <span>{req.appointmentId?.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{req.appointmentId?.slot}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-xs font-semibold">
                                            {req.appointmentId?.type}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Amount Due</p>
                                        <p className="text-2xl font-black text-slate-800">₹{req.amount}</p>
                                    </div>
                                    <Button
                                        icon={CreditCard}
                                        loading={payingId === req._id}
                                        onClick={() => handlePay(req)}
                                        className="w-full md:w-auto"
                                    >
                                        Pay Now
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Credits will be deducted from your balance and added to doctor's wallet.</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
