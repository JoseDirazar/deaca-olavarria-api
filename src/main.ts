import './config/dd-tracer';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { urlencoded, json } from 'express';
import * as pg from 'pg';
import { DataService } from './scripts/DataService';
import { HttpExceptionFilter } from './infrastructure/filters/global-exception.filter';
import { winstonLogger } from './infrastructure/loggers/winston.logger';

export const logger = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production' ? winstonLogger : new Logger('workitfy-backend');

async function bootstrap() {
  pg.defaults.parseInputDatesAsUTC = false;
  pg.types.setTypeParser(1114, (stringValue: string) => new Date(`${stringValue}Z`));

  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    origin: [/http\:\/\/localhost\:\d{1,5}$/, /https\:\/\/deaca\.forgebyteslab\.com$/, /https\:\/\/deaca\.com$/],
  });
  app.setGlobalPrefix('api');

  const loadData = app.get(DataService);
  await loadData.loadDataByDefault();

  await app.listen(process.env.PORT ?? 4003);
}
bootstrap();
