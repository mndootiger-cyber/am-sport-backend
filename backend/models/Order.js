import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:        { type: String, required: true },
    image:       { type: String },
    color:       { type: String },
    size:        { type: String },
    quantity:    { type: Number, required: true, min: 1 },
    price:       { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customerName: {
        type: String,
        required: [true, 'الاسم مطلوب'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        trim: true,
    },
    governorate: {
        type: String,
        required: [true, 'المحافظة مطلوبة'],
        trim: true,
    },
    address: {
        type: String,
        required: [true, 'العنوان مطلوب'],
        trim: true,
    },
    notes: {
        type: String,
        default: '',
        trim: true,
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: v => Array.isArray(v) && v.length > 0,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
