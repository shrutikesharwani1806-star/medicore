import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  isLoggedIn: false,
  isApproved: true,
  profileCompleted: false,

  login: (userData) => set({
    user: userData,
    role: userData.role,
    isLoggedIn: true,
    // Doctors: isActive = true means approved. Patients/admins always approved.
    isApproved: userData.role === 'patient' || userData.role === 'admin' ? true : userData.isActive ?? false,
    profileCompleted: userData.role === 'patient' || userData.role === 'admin' ? true : userData.profileCompleted ?? false,
  }),

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      role: null,
      isLoggedIn: false,
      isApproved: true,
      profileCompleted: false,
    });
  },

  register: (userData) => set({
    user: userData,
    role: userData.role,
    isLoggedIn: true,
    isApproved: userData.role === 'patient' || userData.role === 'admin' ? true : false,
    profileCompleted: false,
  }),

  setRole: (role) => set({ role }),

  approveCurrentDoctor: () => set({ isApproved: true }),

  setProfileCompleted: () => set({ profileCompleted: true }),

  updateProfile: (data) => set((state) => ({
    user: { ...state.user, ...data },
    profileCompleted: data.profileCompleted ?? state.profileCompleted,
  })),

  updateCredits: (credits) => set((state) => ({
    user: { ...state.user, credits },
  })),
}));

export default useAuthStore;
