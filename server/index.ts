import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import router from './routes/router.js';

dotenv.config({ path: path.join('config', '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));
app.use('/api', router);

app.listen(port, () => console.info(`Listening on http://localhost:${port}`));
