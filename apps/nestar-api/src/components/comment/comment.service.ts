import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'; // NestJS common exception va Injectable dekoratori
import { InjectModel } from '@nestjs/mongoose'; // Mongoose modelini injektsiya qilish uchun
import { Model, ObjectId } from 'mongoose'; // Mongoose Model va ObjectId tipi
import { MemberService } from '../member/member.service'; // MemberService injektsiya qilinadi
import { PropertyService } from '../property/property.service'; // PropertyService injektsiya qilinadi
import { BoardArticleService } from '../board-article/board-article.service'; // BoardArticleService injektsiya qilinadi
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input'; // Comment yaratish va inquiry DTO
import { Direction, Message } from '../../libs/enums/common.enum'; // Umumiy enumlar: Direction, Message
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum'; // Commentga oid enumlar: Group va Status
import { CommentUpdate } from '../../libs/dto/comment/comment.update'; // Comment yangilash DTO
import { Comments, Comment } from '../../libs/dto/comment/comment'; // Comment model DTO
import {  lookupMember } from '../../libs/config'; // Konfiguratsiya uchun lookupConfig
import { T } from '../../libs/types/common'; // Umumiy type T

@Injectable() // Bu klass NestJS service sifatida ishlatiladi
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,                   // MongoDB Comment modelini injektsiya qiladi
    private readonly memberService: MemberService,                                           // MemberService injektsiya qilinmoqda
    private readonly propertyService: PropertyService,                                       // PropertyService injektsiya qilinmoqda
    private readonly boardArticleService: BoardArticleService,                               // BoardArticleService injektsiya qilinmoqda
  ) {}

  //================================================
    public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> { // Asinxron funksiya: comment yaratadi
    input.memberId = memberId; // Commentga foydalanuvchi ID ni qo‘shmoqda

   let result: Comment | null = null;
 // Natija uchun o‘zgaruvchi
    try {
        result = await this.commentModel.create(input); // MongoDB model orqali yangi comment yaratadi
    } catch (err) {
        console.log('Error, Service.model:', err.message); // Xatolikni konsolga chiqaradi
        throw new BadRequestException(Message.CREATE_FAILED); // Agar xato bo‘lsa, BadRequestException tashlaydi
    }

    switch (input.commentGroup) { // Comment qaysi guruhga tegishli ekanini tekshiradi
        case CommentGroup.PROPERTY: // Agar property bo‘lsa
            await this.propertyService.propertyStatsEditor({ // Property statistikasi yangilanadi
                _id: input.commentRefId,
                targetKey: 'propertyComments',
                modifier: 1,
            });
            break;
        case CommentGroup.ARTICLE: // Agar article bo‘lsa
            await this.boardArticleService.boardArticleStatsEditor({ // Article statistikasi yangilanadi
                _id: input.commentRefId,
                targetKey: 'articleComments',
                modifier: 1,
            });
            break;
        case CommentGroup.MEMBER: // Agar member bo‘lsa
            await this.memberService.memberStatsEditor({ // Member statistikasi yangilanadi
                _id: input.commentRefId,
                targetKey: 'memberComments',
                modifier: 1,
            });
            break;
    }

    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED); // Agar natija bo‘lmasa, server xatosi tashlaydi
    return result; // Yaratilgan commentni qaytaradi
}

 //===============================================================
  
 public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> { // Asinxron funksiya: comment yangilash
  const { _id } = input; // inputdan _id ni ajratib olmoqda
  const result = await this.commentModel.findOneAndUpdate( // MongoDB da commentni yangilash
    {
      _id: _id, // Yangilanishi kerak bo‘lgan comment ID
      memberId: memberId, // Foydalanuvchi ID mos bo‘lishi kerak
      commentStatus: CommentStatus.ACTIVE, // Faqat ACTIVE statusdagi comment yangilanadi
    },
    input, // Yangilanish uchun berilgan ma’lumotlar
    {
      new: true, // Yangilangan hujjatni qaytaradi
    },
  );
  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED); // Agar natija bo‘lmasa, xato tashlaydi
  return result; // Yangilangan commentni qaytaradi
}

 //==================================================================

 public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments > { // Asinxron funksiya: commentlarni olish
  const { commentRefId } = input.search; // input.search dan commentRefId ni ajratib olmoqda
  const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE }; // Faqat ACTIVE statusdagi commentlarni filter qiladi
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC }; // Sort parametri bo‘yicha tartiblaydi, default createdAt DESC

  const result: Comments[] = await this.commentModel.aggregate([ // MongoDB aggregation pipeline ishlatilmoqda
    { $match: match }, // Filter: commentRefId va status bo‘yicha
    { $sort: sort }, // Tartiblash: sort parametri bo‘yicha
    {
      $facet: { // Bir vaqtning o‘zida list va metaCounter qaytaradi
        list: [
          { $skip: (input.page - 1) * input.limit },                           // Pagination: page va limit asosida skip
          { $limit: input.limit },                                               // Limit: nechta comment qaytarilishi
          // meLiked
          lookupMember,                                                            // lookupMember orqali member ma’lumotlarini qo‘shadi
          { $unwind: '$memberData' },                                             // memberData massivini ajratib chiqaradi
        ],
        metaCounter: [{ $count: 'total' }],                                       // Umumiy sonini hisoblaydi
      },
    },
  ]);
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND); // Agar natija bo‘lmasa, xato tashlaydi

  return result[0];                                                                  // Natijaning birinchi elementini qaytaradi (list va metaCounter)
}

//================================================================
 
  /**ADMIN */
 public async removeCommentByAdmin(input: ObjectId): Promise<Comment> { // Asinxron funksiya: admin commentni o‘chiradi
  const result = await this.commentModel.findByIdAndDelete(input); // MongoDB model orqali commentni ID bo‘yicha o‘chiradi
  if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED); // Agar natija bo‘lmasa, xato tashlaydi
  return result; // O‘chirilgan commentni qaytaradi
}


}
