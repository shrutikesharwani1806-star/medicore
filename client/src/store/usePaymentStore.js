import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const usePaymentStore = create((set, get) => ({
    paymentRequests: [],
    loading: false,
    error: null,

    fetchPaymentRequests: async () => {
        set({ loading: true, error: null });
        try {
            const res = await axiosInstance.get('/payment/requests');
            set({ paymentRequests: res.data, loading: false });
        } catch (error) {
            set({ loading: false, error: error.response?.data?.message || "Failed to fetch payment requests" });
        }
    },

    payRequest: async (appointmentId) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.put(`/appointment/pay-consultation/${appointmentId}`);
            // Remove the request from local state
            set(state => ({
                paymentRequests: state.paymentRequests.filter(req => req.appointmentId?._id !== appointmentId),
                loading: false
            }));
            return res.data;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    }
}));

export default usePaymentStore;
