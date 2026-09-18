import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './service/user.service';
import { UserController } from './server/user.controller';
import { GivingService, Review, User } from '../../models';
import { AuthController } from './server/auth.contoller';
import { AuthService } from './service/auth.service';
import { CurrentUserFromJwtMiddleware } from './middleware/CurrentUserFromJwtMiddleware';
import { GivingServicesController } from './server/giving_service.controller';
import { GivingServicesService } from './service/giving.service';
import { ReviewController } from './server/review.controller';
import { ReviewService } from './service/review.service';
import Redis from 'ioredis';
import { getRedisConnection } from './utils/redis.utils';
import { BullModule } from '@nestjs/bullmq';

import { EmailService } from './bullmq/queues/EmailService';
import { WelcomeEmail } from './bullmq/queues/WelcomeEmailProcessor';
import { ConfirmationEmail } from './bullmq/queues/EmailConfirmationProcessor';
import { PasswordResetEmail } from './bullmq/queues/PasswordResetProcessor';
import { RequestServiceService } from './service/request_service.service';
import RequestService from 'models/src/db-models/request-service';
import { RequestServiceController } from './server/request_service.controller';

const CONTROLLERS = [
  AppController,
  UserController,
  AuthController,
  GivingServicesController,
  ReviewController,
  RequestServiceController,
];

const MODELS = [User, GivingService, Review, RequestService];

const SERVICES = [
  AppService,
  UsersService,
  AuthService,
  GivingServicesService,
  ReviewService,
  RequestServiceService,
];

const EMAIL_CONFIGS = [
  WelcomeEmail,
  ConfirmationEmail,
  PasswordResetEmail,
  EmailService,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    BullModule.forRootAsync({
      useFactory: () => ({
        connection: getRedisConnection(),
      }),
    }),

    BullModule.registerQueue(
      {
        name: 'welcome-queue',
      },
      {
        name: 'confirmation-queue',
      },
      {
        name: 'password-reset-queue',
      },
    ),

    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      models: MODELS,
      autoLoadModels: true,
      synchronize: false,
    }),
    SequelizeModule.forFeature(MODELS),
    JwtModule.register({
      secret: process.env['JWT_ACCESS_SECRET'] || 'access-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [...CONTROLLERS],
  providers: [
    ...SERVICES,
    ...EMAIL_CONFIGS,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisConfig = getRedisConnection();
        const client = new Redis(redisConfig);

        client.on('connect', () => {
          console.log('Successfully connected to Redis via ioredis!');
        });

        client.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return client;
      },
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserFromJwtMiddleware).forRoutes(...CONTROLLERS);
  }
}
