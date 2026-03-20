import api from '../../../lib/axios';

const couponService = {
  getCoupons: async () => {
    const response = await api.get('/api/Coupon');
    return response.data.data;
  },

  getSellerCoupons: async () => {
    const response = await api.get('/api/Coupon/seller');
    return response.data.data;
  },

  getCouponById: async (id) => {
    const response = await api.get(`/api/Coupon/${id}`);
    return response.data.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post('/api/Coupon', couponData);
    return response.data; // Keep full response for creation if it contains success/message
  },

  updateCoupon: async (id, couponData) => {
    const response = await api.put(`/api/Coupon/${id}`, couponData);
    return response.data; 
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/api/Coupon/${id}`);
    return response.data;
  }
};

export default couponService;
