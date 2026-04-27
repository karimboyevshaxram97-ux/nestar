import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Properties } from '../../libs/dto/property/property';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite } from '../../libs/config';

@Injectable()
export class LikeService {
     
 constructor(
 @InjectModel('Like') private readonly likeModel: Model<Like>){}
  
   public async toggleLike(input: LikeInput): Promise<number> {                  // Like qo'shish/o'chirish metodi, modifier qaytaradi
  const search: T = { memberId: input.memberId, likeRefId: input.likeRefId }; // Like qidirish uchun kalit maydonlar
  const exist = await this.likeModel.findOne(search).exec();                  // Bu user bu targetni avval like bosganmi tekshiradi
  let modifier = 1;                                                            // Default: +1 (like qo'shiladi)

  if (exist) {                                                                 // Agar like allaqachon bosilgan bo'lsa
    await this.likeModel.findOneAndDelete(search).exec();                     // Like ni DBdan o'chiradi (unlike)
    modifier = -1;                                                             // -1 qaytaradi (like soni kamayadi)
  } else {                                                                     // Agar like bosilmagan bo'lsa
    try {
      await this.likeModel.create(input);                                     // Yangi like yaratadi va DBga saqlaydi
    } catch (err) {
      console.log('Error, Service.model:', err.message);                      // Xato xabarini consolga chiqaradi
      throw new BadRequestException(Message.CREATE_FAILED);                   // Clientga 400 xatosi qaytaradi
    }
  }

  console.log(`- Like modifier ${modifier} -`);                               // Debug: modifier qiymatini consolga chiqaradi
  return modifier;                                                             // +1 yoki -1 qaytaradi (member.service ga uzatiladi)
}

//=================checklikeexisted ================================
public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {        // Like mavjudligini tekshiruvchi metod
  const { memberId, likeRefId } = input;                                        // memberId va likeRefId ni ajratib oladi
  const result = await this.likeModel.findOne({ memberId, likeRefId }).exec();  // Bu user bu targetni like bosganmi tekshiradi
  return result ? [{ memberId, likeRefId, myFavorite: true }] : [];            // Like bor → [{ myFavorite: true }], yo'q → bo'sh array []
}

//==================================================================
public async getFavoriteProperties(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> { // Liked propertylar ro'yxatini olish metodi
  const { page, limit } = input;                                                                       // Pagination parametrlarini ajratib oladi
  const match: T = { likeGroup: LikeGroup.PROPERTY, memberId: memberId };                             // Faqat PROPERTY turidagi va shu userning likelari

  const data: T = await this.likeModel
    .aggregate([
      { $match: match },                                                                               // Filterlaydi
      { $sort: { updatedAt: -1 } },                                                                   // Yangi → eski tartibda saralaydi
      {
        $lookup: {                                                                                      // likes → properties JOIN
          from: 'properties',                                                                          // properties collectionidan
          localField: 'likeRefId',                                                                     // like collectionidagi kalit maydon
          foreignField: '_id',                                                                         // properties collectionidagi mos maydon
          as: 'favoriteProperty',                                                                      // Natija 'favoriteProperty' nomi bilan qo'shiladi
        },
      },
      { $unwind: '$favoriteProperty' },                                                                // favoriteProperty array → oddiy object
      {
        $facet: {                                                                                       // Parallel 2 ta hisoblash
          list: [
            { $skip: (page - 1) * limit },                                                            // Pagination: sahifani hisoblaydi
            { $limit: limit },                                                                         // Nechta qaytarishni cheklaydi
            lookupFavorite,                                                                            // favoriteProperty.memberData ni biriktiradi
            { $unwind: '$favoriteProperty.memberData' },                                              // memberData array → oddiy object
          ],
          metaCounter: [{ $count: 'total' }],                                                          // Jami son
        },
      },
    ])
    .exec();

   const result: Properties = {list: [], metaCounter: data[0].metaCounter};
   result.list = data[0].list.map((ele) => ele.favoriteProperty);

  return result;                                                                               // ⚠️ Hozircha null — keyinroq to'ldiriladi
}

}
