import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';          // GraphQL dekoratorlari
import { UseGuards } from '@nestjs/common';                                  // Guard ishlatish uchun
import { AuthGuard } from '../auth/guards/auth.guard';                       // Login tekshiruvchi Guard
import { AuthMember } from '../auth/decorators/authMember.decorator';        // Tokendan member ma'lumoti olish
import { WithoutGuard } from '../auth/guards/without.guard';                 // Login bo'lmagan ham kira oladi
import { BoardArticleService } from './board-article.service';               // Business logic service
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update'; // Yangilash DTO si
import { BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input'; // Yaratish va ro'yxat DTO lari
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article'; // Response DTO lari
import { shapeIntoMongoObjectId } from '../../libs/config';                  // String → ObjectId converter
import * as mongoose from 'mongoose';                                         // MongoDB ObjectId tipi

@Resolver()                                                                  // Bu class GraphQL Resolver ekanligini bildiradi
export class BoardArticleResolver {
  constructor(private readonly boardArticleService: BoardArticleService) {}  // Service ni inject qiladi
 //============================1=================================
  @UseGuards(AuthGuard)                                                       // Faqat login bo'lgan user kira oladi
  @Mutation((returns) => BoardArticle)                                        // GraphQL Mutation, BoardArticle qaytaradi
  public async createBoardArticle(
    @Args('input') input: BoardArticleInput,                                  // GraphQL dan maqola ma'lumotlari
    @AuthMember('_id') memberId: mongoose.ObjectId,                                    // Tokendan foydalanuvchi ID si
  ): Promise<BoardArticle> {
    console.log('Mutation: createBoardArticle');                              // Debug log
    return await this.boardArticleService.createBoardArticle(memberId, input); // Service ga uzatadi
  }
  
  //===============================2=============================
  
  @UseGuards(WithoutGuard)                                                      // Login bo'lmagan user ham kira oladi
@Query((returns) => BoardArticle)                                             // GraphQL Query, bitta BoardArticle qaytaradi
public async getBoardArticle(
  @Args('articleId') input: string,                                           // GraphQL dan articleId argumentini oladi (string)
  @AuthMember('_id') memberId: mongoose.ObjectId,                                      // Token bo'lsa memberId oladi, bo'lmasa undefined
): Promise<BoardArticle> {
  console.log('Query: getProperty');                                          // ⚠️ Log noto'g'ri — 'getProperty' emas 'getBoardArticle' bo'lishi kerak
  const articleId = shapeIntoMongoObjectId(input);                            // String → MongoDB ObjectId ga o'giradi
  return await this.boardArticleService.getBoardArticle(memberId, articleId); // Service ga uzatadi
}

//===============================3================================

@UseGuards(AuthGuard)                                                         // Faqat login bo'lgan user kira oladi
@Mutation(() => BoardArticle)                                                 // GraphQL Mutation, BoardArticle qaytaradi
public async updateBoardArticle(
  @Args('input') input: BoardArticleUpdate,                                   // GraphQL dan yangilash ma'lumotlari
  @AuthMember('_id') memberId: mongoose.ObjectId,                                      // Tokendan foydalanuvchi ID si
): Promise<BoardArticle> {
  console.log('Mutation: updateBoardArticle');                                // Debug log
  input._id = shapeIntoMongoObjectId(input._id);                              // input._id String → MongoDB ObjectId ga o'giradi
  return await this.boardArticleService.updateBoardArticle(memberId, input);  // Service ga uzatadi (faqat o'z maqolasini yangilay oladi)
}

//============================4===================================
@UseGuards(WithoutGuard)                                                        // Login bo'lmagan user ham kira oladi
@Query((returns) => BoardArticles)                                              // GraphQL Query, ro'yxat qaytaradi (BoardArticles - ko'plik)
public async getBoardArticles(
  @Args('input') input: BoardArticlesInquiry,                                   // Filter, sort, pagination ma'lumotlari
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Login bo'lsa ObjectId, bo'lmasa undefined
): Promise<BoardArticles> {                                                     // { list: BoardArticle[], metaCounter: [{total}] }
  console.log('Query: getBoardArticles');                                       // Debug log
  return await this.boardArticleService.getBoardArticles(memberId, input);      // Service ga uzatadi
}

}