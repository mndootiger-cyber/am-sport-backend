import express from 'express';
import { createOrder, fetchAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, fetchAllOrders)
    .post(createOrder); // بدون تسجيل دخول، أي زائر يقدر يبعت طلب

router.route('/:id/status')
    .put(protect, updateOrderStatus);

export default router;
