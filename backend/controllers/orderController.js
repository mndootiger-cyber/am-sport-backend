import Order from '../models/Order.js';

// توليد رقم أوردر فريد وسهل القراءة، مثال: AM-482913
const generateOrderNumber = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `AM-${random}`;
};

// @desc    إنشاء طلب جديد (بدون تسجيل دخول)
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
    try {
        const { customerName, phone, governorate, address, notes, items, totalAmount } = req.body;

        // تحقق واضح ومباشر من الحقول المطلوبة
        if (!customerName || !customerName.trim()) {
            return res.status(400).json({ message: 'الرجاء إدخال الاسم الكامل.' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ message: 'الرجاء إدخال رقم الهاتف.' });
        }
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({ message: 'رقم الهاتف غير صحيح.' });
        }
        if (!governorate || !governorate.trim()) {
            return res.status(400).json({ message: 'الرجاء اختيار المحافظة.' });
        }
        if (!address || !address.trim()) {
            return res.status(400).json({ message: 'الرجاء إدخال العنوان بالتفصيل.' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'السلة فارغة.' });
        }

        // نحاول توليد رقم أوردر فريد (نادرًا ما يحصل تكرار، لكن نحتاط)
        let orderNumber;
        let attempts = 0;
        do {
            orderNumber = generateOrderNumber();
            attempts++;
        } while (await Order.findOne({ orderNumber }) && attempts < 5);

        const order = await Order.create({
            orderNumber,
            customerName: customerName.trim(),
            phone: phone.trim(),
            governorate: governorate.trim(),
            address: address.trim(),
            notes: (notes || '').trim(),
            items,
            totalAmount,
        });

        res.status(201).json({
            success: true,
            orderNumber: order.orderNumber,
            order,
        });
    } catch (error) {
        console.error('[Order] createOrder error:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.' });
    }
};

// @desc    جلب كل الطلبات (للأدمن فقط)
// @route   GET /api/orders
// @access  Private
export const fetchAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الطلبات.' });
    }
};

// @desc    تحديث حالة الطلب (للأدمن فقط)
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updated) return res.status(404).json({ message: 'الطلب غير موجود.' });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ message: 'خطأ في تحديث الطلب.' });
    }
};
