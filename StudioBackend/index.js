import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import staffRoutes from './routes/staff.js';
import scheduleRoutes from './routes/schedule.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGODB_URI;

app.use(cors({
          origin: [
                    'https://studio-sand-three-39.vercel.app',
                    'http://localhost:5173'
          ]
}));
app.use(express.json());

app.use('/api/staff', staffRoutes);
app.use('/api/schedule', scheduleRoutes);

app.get('/', (_req, res) => {
          res.json({ ok: true, msg: 'Lagree scheduler backend running' });
});

async function start() {
          if (!MONGO) {
                    console.error('MONGODB_URI not set in environment. Put your MongoDB URL in .env as MONGODB_URI');
                    process.exit(1);
          }

          try {
                    await mongoose.connect(MONGO, { dbName: 'lagree_scheduler' });
                    console.log('Connected to MongoDB');

                    app.listen(PORT, () => {
                              console.log(`Server listening on port ${PORT}`);
                    });
          } catch (err) {
                    console.error('Failed to start server', err);
                    process.exit(1);
          }
}

start();
