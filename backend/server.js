import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import connectDatabase from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();
const app = express();

// Security & Middlewares
app.use(helmet({ crossOriginResourcePolicy: false })); // السماح بعرض الصور للفرونت اند
app.use(cors());
app.use(express.json());

// Routes Linking
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

// جعل مجلد uploads مرئياً ليتمكن الموقع من قراءة الصور
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Root Seeder Helper to guarantee immediate startup data display
const autoSeedProducts = async () => {
    import('./models/Product.js').then(async (model) => {
        const Product = model.default;
        const count = await Product.countDocuments();
        if(count === 0) {
            await Product.insertMany([
                { name: "طقم ليفل المخملي قطعة واحدة", category: "clothing", price: 2100, image: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop", description: "مصنوع من نسيج فاخر مرن ومقاوم للتعرق لتوفير تجربة بيلاتس مريحة وأنيقة تماماً." },
                { name: "حبل بيلاتس المقاوم الاحترافي", category: "equipment", price: 850, image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop", description: "مقابض جلدية فاخرة وحبال مرنة عالية التحمل لتوفير أقصى درجات الثبات والتحكم الفاخر." },
                { name: "سجادة الـ Aero Cushioned الفاخرة", category: "clothing", price: 1450, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=600&auto=format&fit=crop", description: "سجادة مبطنة مانعة للانزلاق بسماكة ممتازة، مطبوعة بشعار البراند بالليزر بشكل فريد وهادئ." }
            ]);
            console.log('Seeded Initial Luxury Collection Items Successfully.');
        }
    });
};

const PORT = process.env.PORT || 5000;

// Connect DB and Up Server
connectDatabase().then(() => {
    autoSeedProducts();
    app.listen(PORT, () => {
        console.log(`🚀 Production Server running on port ${PORT}`);
    });
});