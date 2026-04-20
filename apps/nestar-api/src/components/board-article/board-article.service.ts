import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'; // NestJS exception classlari
import { InjectModel } from '@nestjs/mongoose';                                                  // MongoDB modelini inject qilish uchun
import { Model, ObjectId } from 'mongoose';                                                      // Mongoose Model va ObjectId tiplari
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';        // Response DTO lari (bitta va ro'yxat)
import { MemberService } from '../member/member.service';                                         // Member statistikasi uchun
import { ViewService } from '../view/view.service';                                               // Ko'rishlarni qayd etish uchun
import { BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input'; // Input DTO lari
import { Direction, Message } from '../../libs/enums/common.enum';                               // Saralash va xabar enumlari
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';                        // ACTIVE, DELETE enumlari
import { ViewGroup } from '../../libs/enums/view.enum';                                           // Ko'rish guruhi (BOARD_ARTICLE...)
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';          // Yangilash DTO si
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';                         // Yordamchi funksiyalar
import { StatisticModifier, T } from '../../libs/types/common';                                   // Statistika turi va T (any object)

@Injectable()                                                                                     // NestJS DI uchun belgi
export class BoardArticleService {
  constructor(
    @InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,         // 'BoardArticle' MongoDB modelini inject qiladi
    private readonly memberService: MemberService,                                                 // Member statistikasini yangilash uchun
    private readonly viewService: ViewService,                                                     // Ko'rishlarni qayd etish uchun
  ) {}
  //=============================1==================================
  public async createBoardArticle(memberId: ObjectId, input: BoardArticleInput): Promise<BoardArticle> { // Yangi maqola yaratish metodi
    input.memberId = memberId;                                                                     // Inputga yaratuvchining ID sini qo'shadi
    try {
      const result = await this.boardArticleModel.create(input);                                  // MongoDB ga yangi maqola yaratadi va saqlaydi
      await this.memberService.memberStatsEditor({                                                 // Member statistikasini yangilaydi
        _id: memberId,                                                                             // Maqola yozgan memberning ID si
        targetKey: 'memberArticles',                                                               // memberArticles maydonini o'zgartiradi
        modifier: 1,                                                                               // +1 qo'shadi (maqolalar soni oshadi)
      });

      return result;                                                                               // Yaratilgan maqolani qaytaradi
    } catch (err) {
      console.log('Error, Service.model:', err.message);                                          // Xato xabarini consolga chiqaradi
      throw new BadRequestException(Message.CREATE_FAILED);                                       // Clientga 400 xatosi qaytaradi
    }
  }

  //========================2======================================
 
 public async getBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> { // Bitta maqolani ID bo'yicha olish metodi
  const search: T = {
    _id: articleId,                                                                              // Qidirilayotgan maqola ID si
    articleStatus: BoardArticleStatus.ACTIVE,                                                    // Faqat ACTIVE maqolani qaytaradi
  };

  const targetBoardArticle: BoardArticle |null = await this.boardArticleModel.findOne(search).lean().exec(); // MongoDB dan bitta hujjat qidiradi
                                                                                                 // .lean() = toza JS object (tezroq)
                                                                                                 // .exec() = Promise qaytaradi
  if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND);       // Topilmasa 500 xatosi qaytaradi

  if (memberId) {                                                                                // Agar foydalanuvchi login bo'lgan bo'lsa
    const viewInput = { memberId: memberId, viewRefId: articleId, viewGroup: ViewGroup.ARTICLE }; // Ko'rish ma'lumotlarini tayyorlaydi
    const newView = await this.viewService.recordView(viewInput);                               // Ko'rishni qayd etadi (takroran qayd etmaydi)
    if (newView) {                                                                               // Agar yangi ko'rish bo'lsa (takror emas)
      await this.boardArticleStatsEditor({ _id: articleId, targetKey: 'articleViews', modifier: 1 }); // DBda articleViews +1
      targetBoardArticle.articleViews++;                                                         // Lokal objectda ham +1 (DB ga qayta so'rov yubormaslik uchun)
    }

    // meLiked — hozircha yozilmagan (keyinroq qo'shiladi)
  }

  targetBoardArticle.memberData = await this.memberService.getMember(memberId, targetBoardArticle.memberId); // Maqola egasining ma'lumotlarini oladi
                                                                                                 // ⚠️ null — memberId o'rniga, chunki public sahifa (o'zi emas)
  return targetBoardArticle;                                                                     // To'liq maqola ma'lumotini qaytaradi
} 

//=========================3=====================================================
 
public async updateBoardArticle(memberId: ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> { // Maqolani yangilash metodi
  const { _id, articleStatus } = input;                                                          // ID va yangi statusni ajratib oladi

  const result = await this.boardArticleModel
    .findOneAndUpdate(
      { _id: _id, memberId: memberId, articleStatus: BoardArticleStatus.ACTIVE },                // Faqat o'z ACTIVE maqolasini topadi
      input,                                                                                      // Yangi ma'lumotlar bilan yangilaydi
      { new: true },                                                                              // Yangilangan hujjatni qaytaradi (eski emas)
    )
    .exec();                                                                                      // Promise qaytaradi

  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);                    // Topilmasa yoki yangilanmasa 500 xatosi

  if (articleStatus === BoardArticleStatus.DELETE) {                                             // Agar maqola o'chirilgan bo'lsa
    await this.memberService.memberStatsEditor({
      _id: memberId,                                                                              // Maqola egasining ID si
      targetKey: 'memberArticles',                                                                // memberArticles maydonini o'zgartiradi
      modifier: -1,                                                                               // -1 kamayadi (maqolalar soni kamaydi)
    });
  }

  return result;                                                                                  // Yangilangan maqolani qaytaradi
}

//============================4=========================================
 public async getBoardArticles(memberId: ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> { // Maqolalar ro'yxatini olish metodi
  const { articleCategory, text } = input.search;                                                // Filter parametrlarini ajratib oladi
  const match: T = { articleStatus: BoardArticleStatus.ACTIVE };                                 // Faqat ACTIVE maqolalar
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };          // Sort (default: yangi → eski)

  if (articleCategory) match.articleCategory = articleCategory;                                  // Kategoriya bo'yicha filter (ixtiyoriy)
  if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };                             // Sarlavhada matn qidiradi (katta-kichik harfsiz)
  if (input.search?.memberId) {                                                                  // Muayyan member bo'yicha filter
    match.memberId = shapeIntoMongoObjectId(input.search.memberId);                              // String → MongoDB ObjectId ga o'giradi
  }
  console.log('match:', match);                                                                  // Debug uchun filter shartlarini consolga chiqaradi

  const result = await this.boardArticleModel
    .aggregate([
      { $match: match },                                                                          // 1: Filterlaydi
      { $sort: sort },                                                                            // 2: Saralaydi
      {
        $facet: {                                                                                  // 3: Parallel 2 ta hisoblash
          list: [
            { $skip: (input.page - 1) * input.limit },                                           // Pagination: sahifani hisoblaydi
            { $limit: input.limit },                                                              // Nechta qaytarishni cheklaydi
            // meLiked — hozircha yozilmagan (keyinroq qo'shiladi)
            lookupMember,                                                                         // Egasining ma'lumotlarini JOIN qiladi ($lookup)
            { $unwind: '$memberData' },                                                           // memberData array → oddiy object ga o'giradi
          ],
          metaCounter: [{ $count: 'total' }],                                                     // Jami mos keluvchi hujjatlar sonini hisoblaydi
        },
      },
    ])
    .exec();                                                                                      // Promise qaytaradi
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);             // Natija bo'sh bo'lsa 500 xatosi

  return result[0];                                                                               // { list: BoardArticle[], metaCounter: [{total: n}] }
}

//=========================5================2 ga tegishli logic=========

public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle | null> { // Maqola statistikasini o'zgartiruvchi universal metod
  const { _id, targetKey, modifier } = input;                                            // Input dan kerakli qiymatlarni ajratib oladi
  return await this.boardArticleModel
    .findByIdAndUpdate(
      _id,                                                                               // Qaysi hujjatni yangilash
      { $inc: { [targetKey]: modifier } },                                               // targetKey maydonini modifier ga o'zgartiradi (+1 yoki -1)
      { new: true },                                                                     // Yangilangan hujjatni qaytaradi (eski emas)
    )
    .exec();                                                                             // Promise qaytaradi
}

}
