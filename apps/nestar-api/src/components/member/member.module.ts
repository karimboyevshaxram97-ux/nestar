import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';                              // Member GraphQL resolver
import { MemberService } from './member.service';                               // Member business logic
import { MongooseModule } from '@nestjs/mongoose';                              // MongoDB model ro'yxatdan o'tkazish uchun
import MemberSchema from '../../schemas/Member.model';                          // Member MongoDB schemasi
import { AuthModule } from '../auth/auth.module';                               // JWT token va autentifikatsiya uchun
import { ViewModule } from '../view/view.module';                               // Ko'rishlarni qayd etish uchun
import { LikeModule } from '../like/like.module';                               // Like funksionalligi uchun
import FollowSchema from '../../schemas/Follow.model';                          // Follow MongoDB schemasi

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),      // Member modelini ro'yxatdan o'tkazadi
    MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),      // ⚠️ Follow modeli MemberModule da — FollowModule da bo'lishi kerak edi
    AuthModule,                                                                  // AuthService ishlatish uchun
    ViewModule,                                                                  // ViewService ishlatish uchun
    LikeModule,                                                                  // LikeService ishlatish uchun
  ],
  providers: [MemberResolver, MemberService],                                   // ⚠️ FollowService yo'q — kerak bo'lsa qo'shiladi
  exports: [MemberService],                                                      // Boshqa modullar MemberService ni ishlatishi uchun
})
export class MemberModule {}