import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useAppointmentStore = create((set, get) => ({
  appointments: [],
  loading: false,
  error: null,

  // Fetch patient's appointments from API
  fetchPatientAppointments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get('/appointment/user');
      const formatted = (res.data || []).map(apt => ({
        id: apt._id,
        _id: apt._id,
        patientId: apt.patientId?._id || apt.patientId,
        patientName: apt.patientId?.name || 'Unknown',
        patientImage: apt.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=Patient`,
        doctorId: apt.doctorId?._id || apt.doctorId,
        doctorName: apt.doctorId?.name || 'Unknown Doctor',
        doctorImage: apt.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=Doctor`,
        specialization: apt.doctorId?.category || 'General',
        date: apt.date,
        time: apt.slot,
        status: apt.status,
        type: apt.type || 'Consultation',
        reason: apt.symptoms,
        amount: apt.amount,
        report: apt.report,
        isOnlineFeePaid: apt.isOnlineFeePaid,
        isPaid: apt.isPaid,
      }));
      set({ appointments: formatted, loading: false });
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      set({ appointments: [], loading: false, error: error.response?.data?.message });
    }
  },

  // Fetch doctor's appointments from API
  fetchDoctorAppointments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get('/doctor/apointments');
      const formatted = (res.data || []).map(apt => ({
        id: apt._id,
        _id: apt._id,
        patientId: apt.patientId?._id || apt.patientId,
        patientName: apt.patientId?.name || 'Unknown',
        patientImage: apt.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=Patient`,
        patientEmail: apt.patientId?.email,
        patientPhone: apt.patientId?.phone,
        doctorId: apt.doctorId?._id || apt.doctorId,
        doctorName: apt.doctorId?.name || 'Doctor',
        doctorImage: apt.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=Doctor`,
        specialization: apt.doctorId?.category || 'General',
        date: apt.date,
        time: apt.slot,
        status: apt.status,
        type: apt.type || 'Consultation',
        reason: apt.symptoms,
        amount: apt.amount,
        isPaid: apt.isPaid,
      }));
      set({ appointments: formatted, loading: false });
    } catch (error) {
      console.error("Failed to fetch doctor appointments:", error);
      set({ appointments: [], loading: false, error: error.response?.data?.message });
    }
  },

  // Book a new appointment via API
  bookAppointment: async (appointmentData) => {
    try {
      const res = await axiosInstance.post(`/appointment/book/${appointmentData.doctorId}`, {
        date: appointmentData.date,
        slot: appointmentData.time,
        symptoms: appointmentData.reason || appointmentData.symptoms,
        type: appointmentData.type,
        report: appointmentData.report,
      });
      // Refresh appointments
      await get().fetchPatientAppointments();
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel appointment via API
  cancelAppointment: async (id) => {
    try {
      await axiosInstance.put(`/appointment/cancel/${id}`);
      // Update local state
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, status: 'cancelled' } : apt
        )
      }));
    } catch (error) {
      throw error;
    }
  },

  // Doctor: Accept appointment
  acceptAppointment: async (id) => {
    try {
      await axiosInstance.put(`/appointment/status/${id}`, { status: 'confirmed' });
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, status: 'confirmed' } : apt
        )
      }));
    } catch (error) {
      throw error;
    }
  },

  // Doctor: Reject appointment
  rejectAppointment: async (id, message) => {
    try {
      await axiosInstance.put(`/appointment/status/${id}`, { status: 'rejected', rejectionMessage: message });
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, status: 'rejected' } : apt
        )
      }));
    } catch (error) {
      throw error;
    }
  },

  // Doctor: Complete appointment
  completeAppointment: async (id, paymentMethod = 'credits') => {
    try {
      await axiosInstance.put(`/appointment/status/${id}`, {
        status: 'completed',
        paymentMethod
      });
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, status: 'completed', isPaid: paymentMethod === 'cash' } : apt
        )
      }));
    } catch (error) {
      throw error;
    }
  },

  // Patient: Pay consultation fee
  payConsultationFee: async (id) => {
    try {
      const res = await axiosInstance.put(`/appointment/pay-consultation/${id}`);
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, isPaid: true, isOnlineFeePaid: true } : apt
        )
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getPatientAppointments: (patientId) => {
    return get().appointments.filter((apt) => apt.patientId === patientId);
  },

  getDoctorAppointments: (doctorId) => {
    return get().appointments.filter((apt) => apt.doctorId === doctorId);
  },
}));

export default useAppointmentStore;
