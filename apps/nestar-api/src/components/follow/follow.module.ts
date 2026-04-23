import { Module } from '@nestjs/common';                          // NestJS modul uchun
import { MongooseModule } from '@nestjs/mongoose';                // MongoDB model ro'yxatdan o'tkazish uchun
import { FollowResolver } from './follow.resolver';
import { FollowService } from './follow.service';
import FollowSchema from '../../schemas/Follow.model';            // Follow Schema si
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    MongooseModule.forFeature([                                   // Follow modelini shu modul uchun ro'yxatdan o'tkazadi
      {
        name: 'Follow',                                           // Model nomi — @InjectModel('Follow') da ishlatiladi
        schema: FollowSchema,                                     // MongoDB schema si
      },
    ]),
    AuthModule,
    MemberModule,
    
  ],
  providers: [FollowResolver, FollowService],
  exports: [FollowModule],
})
export class FollowModule {}                                      // Follow moduli — hozircha service va resolver yo'q