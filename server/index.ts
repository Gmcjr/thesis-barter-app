import * as express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from './db/index.ts';

dotenv.config({ path: './config/.env' });

const app = express.default();
const port = 3000;

app.use(express.static(path.join('client', 'dist')));
app.use(express.json());

// console.log(prisma);

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.info(`
    App listening on:
    - http://localhost:3000
    - http://127.0.0.1:3000
    `);
});
