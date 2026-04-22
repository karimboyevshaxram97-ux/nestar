import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class LikeService {
     
     constructor(
          @InjectModel('Like') private readonly likeModel: Model<Member>){}
  
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

}
