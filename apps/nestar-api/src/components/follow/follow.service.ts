import { Injectable } from '@nestjs/common';                            // NestJS DI uchun
import { InjectModel } from '@nestjs/mongoose';                         // MongoDB modelini inject qilish uchun
import { Model } from 'mongoose';                                       // Mongoose Model tipi
import { Follower, Following } from '../../libs/dto/follow/follow';     // Follow DTO lari
import { MemberService } from '../member/member.service';               // Member statistikasi uchun

@Injectable()                                                            // NestJS DI uchun belgi
export class FollowService {
  constructor(
    @InjectModel('Follow') private readonly followModel: Model<Follower | Following>, // 'Follow' MongoDB modelini inject qiladi
    private readonly memberService: MemberService,                       // Member statistikasini yangilash uchun
  ) {}
}