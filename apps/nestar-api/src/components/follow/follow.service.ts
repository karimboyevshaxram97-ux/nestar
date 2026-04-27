import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';                            // NestJS DI uchun
import { InjectModel } from '@nestjs/mongoose';                         // MongoDB modelini inject qilish uchun
import { Model, ObjectId } from 'mongoose';                                       // Mongoose Model tipi
import { Follower, Followers, Following, Followings } from '../../libs/dto/follow/follow';     // Follow DTO lari
import { MemberService } from '../member/member.service';               // Member statistikasi uchun
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked, lookupFollowerData, lookupFollowingData } from '../../libs/config';

@Injectable()                                                            // NestJS DI uchun belgi
export class FollowService {
  constructor(
    @InjectModel('Follow') private readonly followModel: Model<Follower | Following>, // 'Follow' MongoDB modelini inject qiladi
    private readonly memberService: MemberService,                       // Member statistikasini yangilash uchun
  ) {}
 
  //================================================
 public async subscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> { // Kuzatishga obuna bo'lish metodi
  if (followerId.toString() === followingId.toString()) {                                 // O'zini o'zi kuzata olmaydi
    throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);           // 500 xatosi qaytaradi
  }

  const targetMember = await this.memberService.getMember(followerId, followingId);          // Kuzatilayotgan member mavjudmi tekshiradi
  if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);     // Topilmasa 500 xatosi

  const result = await this.registerSubscription(followerId, followingId);             // Obunani DBga saqlaydi

  await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: 1 });  // Kuzatuvchining followings soni +1
  await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: 1 }); // Kuzatilayotganning followers soni +1

  return result;                                                                         // Yaratilgan follow ma'lumotini qaytaradi
}

private async registerSubscription(followerId: ObjectId, followingId: ObjectId): Promise<Follower> { // Obunani DBga saqlash (private — faqat ichki ishlatiladi)
  try {
    return await this.followModel.create({                                     // Yangi follow hujjat yaratadi va DBga saqlaydi
      followingId: followingId,                                                // Kuzatilayotgan member ID si
      followerId: followerId,                                                  // Kuzatuvchi member ID si
    });
  } catch (err) {
    console.log('Error, Service.model:', err.message);                        // Xato xabarini consolga chiqaradi
    throw new BadRequestException(Message.CREATE_FAILED);                     // ⚠️ Takroran obuna bo'lmoqchi bo'lsa — 400 xatosi (unique index)
  }
}
//================================================================
public async unsubscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> { // Kuzatishni bekor qilish metodi
  const targetMember = await this.memberService.getMember(followerId, followingId);        // Kuzatilayotgan member mavjudmi tekshiradi
  if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);       // Topilmasa 500 xatosi

  const result = await this.followModel.findOneAndDelete({                                 // Follow hujjatini DBdan o'chiradi
    followingId: followingId,                                                              // Kuzatilayotgan member ID si
    followerId: followerId,                                                                // Kuzatuvchi member ID si
  });
  if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);             // Topilmasa 500 xatosi

  await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: -1 });  // Kuzatuvchining followings soni -1
  await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: -1 }); // Kuzatilayotganning followers soni -1

  return result;                                                                           // O'chirilgan follow ma'lumotini qaytaradi
}

//===============================================================
public async getMemberFollowings(memberId: ObjectId, input: FollowInquiry): Promise<Followings> { // Member kuzatayotganlar ro'yxatini olish
  const { page, limit, search } = input;                                                          // Pagination va filter ajratib olinadi
  if (!search?.followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);           // followerId bo'lmasa 500 xatosi
  const match: T = { followerId: search?.followerId };                                            // Faqat shu member kuzatayotganlarni filter qiladi
  console.log('match:', match);                                                                   // Debug log

  const result = await this.followModel
    .aggregate([
      { $match: match },                                                                           // Filterlaydi
      { $sort: { createdAt: Direction.DESC } },                                                   // Yangi → eski tartibda saralaydi
      {
        $facet: {                                                                                   // Parallel 2 ta hisoblash
          list: [
            { $skip: (page - 1) * limit },                                                        // Pagination: sahifani hisoblaydi
            { $limit: limit },                                                                     // Nechta qaytarishni cheklaydi
              lookupAuthMemberLiked(memberId, "$followingId"),
            lookupAuthMemberFollowed({
            followerId: memberId,
            followingId: '$followingId',
           }),
            lookupFollowingData,                                                                   // Kuzatilayotgan member ma'lumotlarini JOIN qiladi
            { $unwind: '$followingData' },                                                         // followingData array → oddiy object
          ],
          metaCounter: [{ $count: 'total' }],                                                      // Jami son
        },
      },
    ])
    .exec();
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);             // Bo'sh bo'lsa 500 xatosi

  return result[0];                                                                               // { list: Following[], metaCounter: [{total}] }
}

//==========================================================
 public async getMemberFollowers(memberId: ObjectId, input: FollowInquiry): Promise<Followers> { // Member kuzatuvchilar ro'yxatini olish
  const { page, limit, search } = input;                                                        // Pagination va filter ajratib olinadi
  if (!search?.followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);        // followingId bo'lmasa 500 xatosi

  const match: T = { followingId: search?.followingId };                                        // Faqat shu memberni kuzatayotganlarni filter qiladi
  console.log('match:', match);                                                                  // Debug log

  const result = await this.followModel
    .aggregate([
      { $match: match },                                                                         // Filterlaydi
      { $sort: { createdAt: Direction.DESC } },                                                  // Yangi → eski tartibda saralaydi
      {
        $facet: {                                                                                  // Parallel 2 ta hisoblash
          list: [
            { $skip: (page - 1) * limit },                                                       // Pagination: sahifani hisoblaydi
            { $limit: limit },                                                                    // Nechta qaytarishni cheklaydi
            lookupAuthMemberLiked(memberId, "$followers"),
             lookupAuthMemberFollowed({
            followerId: memberId,
            followingId: '$followerId',
           }),
            lookupFollowerData,                                                                   // Kuzatuvchi member ma'lumotlarini JOIN qiladi
            { $unwind: '$followerData' },                                                         // followerData array → oddiy object
          ],
          metaCounter: [{ $count: 'total' }],                                                     // Jami son
        },
      },
    ])
    .exec();
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);            // Bo'sh bo'lsa 500 xatosi

  return result[0];                                                                              // { list: Follower[], metaCounter: [{total}] }
}
 
}