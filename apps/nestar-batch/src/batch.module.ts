import { Module } from '@nestjs/common';                                        // NestJS modul uchun
import { BatchController } from './batch.controller';                          // Batch controller
import { BatchService } from './batch.service';                                // Batch service
import { ConfigModule } from '@nestjs/config';                                 // .env fayllarni o'qish uchun
import { DatabaseModule } from './database/database.module';                  // MongoDB ulanish uchun
import { ScheduleModule } from '@nestjs/schedule';                            // Cron job lar uchun
import PropertySchema from 'apps/nestar-api/src/schemas/Property.model';      // Property MongoDB schemasi
import MemberSchema from 'apps/nestar-api/src/schemas/Member.model';          // Member MongoDB schemasi
import { MongooseModule } from '@nestjs/mongoose';                            // MongoDB model ro'yxatdan o'tkazish uchun

@Module({
  imports: [
    ConfigModule.forRoot(),                                                    // .env faylni yuklaydi
    DatabaseModule,                                                            // MongoDB ulanishini ta'minlaydi
    ScheduleModule.forRoot(),                                                  // Cron job larni ishga tushiradi
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]), // Property modelini ro'yxatdan o'tkazadi
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),    // Member modelini ro'yxatdan o'tkazadi
  ],
  controllers: [BatchController],                                              // Batch controller
  providers: [BatchService],                                                   // Batch service
})
export class BatchModule {}