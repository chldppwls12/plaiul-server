import 'reflect-metadata';
import express from 'express';
import AppDataSource from './config/data-source';
import 'dotenv/config';
import routes from '@routes/index';

const app = express();

AppDataSource.initialize()
  .then(async () => {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use('/api', routes);
    app
      .listen(process.env.PORT, () => {
        console.log(`${process.env.NODE_ENV} - API Server Start At Port ${process.env.PORT}`);
      })
      .on('error', err => {
        console.log(err);
        process.exit(1);
      });
  })
  .catch(err => console.log(err));
