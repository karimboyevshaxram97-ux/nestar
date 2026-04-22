import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'; // NestJS GraphQL dekoratorlarini import qilmoqda
import { CommentService } from './comment.service'; // CommentService ni chaqirib, biznes logikani ishlatadi
import { UseGuards } from '@nestjs/common'; // NestJS guardlarni qo‘llash uchun
import { AuthGuard } from '../auth/guards/auth.guard'; // AuthGuard orqali autentifikatsiya nazorati
import * as mongoose from 'mongoose'; // MongoDB ObjectId tipini ishlatadi
import { AuthMember } from '../auth/decorators/authMember.decorator'; // AuthMember dekoratori orqali foydalanuvchi ID sini olish 
import { WithoutGuard } from '../auth/guards/without.guard'; // Guard: autentifikatsiyasiz kirish uchun
import { Comments, Comment } from '../../libs/dto/comment/comment';
import { CommentUpdate } from '../../libs/dto/comment/comment.update'; // DTO: comment yangilash uchun
import { shapeIntoMongoObjectId } from '../../libs/config';  // Stringni ObjectId ga aylantirish uchun yordamchi funksiya
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';  // DTO: comment yaratish uchun input
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';


@Resolver() // GraphQL resolver klassi
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {} // CommentService injektsiya qilinmoqda

//================================================================
  @UseGuards(AuthGuard)                                               // AuthGuard qo‘llanmoqda, faqat login bo‘lganlar kiradi
  @Mutation(() => Comment)                                           // GraphQL mutation: Comment obyektini qaytaradi
  public async createComment(
    @Args('input') input: CommentInput,                              // GraphQL argument: input DTO
    @AuthMember('_id') memberId: mongoose.ObjectId,                  // AuthMember dekoratori orqali foydalanuvchi ID olinadi
  ): Promise<Comment> {
    console.log('Mutation: createComment');                           // Konsolga log chiqaradi
    return await this.commentService.createComment(memberId, input); // CommentService orqali comment yaratadi
  }

  //==============================================================
   
  @UseGuards(AuthGuard)                                               // AuthGuard qo‘llanmoqda, faqat autentifikatsiyadan o‘tgan foydalanuvchilar kiradi
@Mutation(returns => Comment)                                           // GraphQL mutation: Comment obyektini qaytaradi
public async updateComment(
  @Args('input') input: CommentUpdate,                                  // GraphQL argument: comment yangilash uchun DTO
  @AuthMember('_id') memberId: mongoose.ObjectId,                      // AuthMember dekoratori orqali foydalanuvchi ID olinadi
): Promise<Comment> {
  console.log('Mutation: updateComment');                              // Konsolga log chiqaradi
  input._id = shapeIntoMongoObjectId(input._id);                       // String ID ni Mongo ObjectId ga aylantiradi
  return await this.commentService.updateComment(memberId, input);     // CommentService orqali yangilash jarayonini bajaradi
}

//================================================================

 @UseGuards(WithoutGuard)                                              // WithoutGuard qo‘llanmoqda, bu yerda autentifikatsiyasiz kirish ruxsat etiladi
@Query((returns) => Comments)                                          // GraphQL query: Comments obyektini qaytaradi
public async getComments( 
  @Args('input') input: CommentsInquiry,                              // GraphQL argument: commentlarni olish uchun inquiry DTO
  @AuthMember('_id') memberId: mongoose.ObjectId,                      // AuthMember dekoratori orqali foydalanuvchi ID olinadi
): Promise<Comments> {
  console.log('query: getComments');                                   // Konsolga log chiqaradi
  input.search.commentRefId = shapeIntoMongoObjectId(input.search.commentRefId); // String ID ni Mongo ObjectId ga aylantiradi
  const result = await this.commentService.getComments(memberId, input); // CommentService orqali commentlarni olish jarayonini bajaradi
  return result;                                                   // Olingan commentlarni qaytaradi
}

//================================================================

/**ADMIN  */
@Roles(MemberType.ADMIN)                                                                 // Faqat ADMIN roliga ega bo‘lgan foydalanuvchilarga ruxsat beriladi
@UseGuards(RolesGuard)                                                                  // RolesGuard qo‘llanmoqda, rolni tekshiradi
@Mutation((returns) => Comment)                                                         // GraphQL mutation: Comment obyektini qaytaradi
public async removeCommentByAdmin(@Args('commentId') input: string): Promise<Comment> { // Asinxron funksiya: admin commentni o‘chiradi
  console.log('Mutation: removeCommentByAdmin');                                        // Konsolga log chiqaradi
  const commentId = shapeIntoMongoObjectId(input);                                      // String ID ni Mongo ObjectId ga aylantiradi
  return await this.commentService.removeCommentByAdmin(commentId);                      // CommentService orqali commentni o‘chirish jarayonini bajaradi
}


}
