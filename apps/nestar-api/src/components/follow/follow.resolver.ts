import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';                              // GraphQL Resolver uchun
import { FollowService } from './follow.service';                        // Follow business logic service
import * as mongoose from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Follower, Followers, Followings } from '../../libs/dto/follow/follow';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()                                                              // Bu class GraphQL Resolver ekanligini bildiradi
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}         // FollowService ni inject qiladi

//=========================================================
@UseGuards(AuthGuard)                                                           // Faqat login bo'lgan user kira oladi
@Mutation((returns) => Follower)                                                // GraphQL Mutation, Follower qaytaradi
public async subscribe(
  @Args('input') input: string,                                                 // Kuzatilayotgan member ID si (string)
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Tokendan kuzatuvchi user ning ID si
): Promise<Follower> {
  console.log('Mutation: subscribe');                                           // Debug log
  const followingId = shapeIntoMongoObjectId(input);                           // String → MongoDB ObjectId ga o'giradi
  return await this.followService.subscribe(memberId, followingId);            // Service ga uzatadi
}

//=========================================================
@UseGuards(AuthGuard)                                                           // Faqat login bo'lgan user kira oladi
@Mutation((returns) => Follower)                                                // GraphQL Mutation, Follower qaytaradi
public async unsubscribe(
  @Args('input') input: string,                                                 // Kuzatishni bekor qilinadigan member ID si (string)
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Tokendan kuzatuvchi user ning ID si
): Promise<Follower> {
  console.log('Mutation: unsubscribe');                                         // Debug log
  const followingId = shapeIntoMongoObjectId(input);                           // String → MongoDB ObjectId ga o'giradi
  return await this.followService.unsubscribe(memberId, followingId);          // Service ga uzatadi
}

//=======================================================
@UseGuards(WithoutGuard)                                                        // Login bo'lmagan ham kira oladi
@Query((returns) => Followings)                                                 // GraphQL Query, Followings ro'yxati qaytaradi
public async getMemberFollowings(
  @Args('input') input: FollowInquiry,                                          // Filter, pagination ma'lumotlari
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Login bo'lsa ObjectId, bo'lmasa undefined
): Promise<Followings> {
  console.log('Query: getMemberFollowings');                                    // Debug log
  const { followerId } = input.search;                                          // Kimning followinglarini olish kerakligini ajratadi
  input.search.followerId = shapeIntoMongoObjectId(followerId);                 // String → MongoDB ObjectId ga o'giradi
  return await this.followService.getMemberFollowings(memberId, input);         // Service ga uzatadi
} 

//==================================================== 
@UseGuards(WithoutGuard)                                                        // Login bo'lmagan ham kira oladi
@Query((returns) => Followers)                                                  // GraphQL Query, Followers ro'yxati qaytaradi
public async getMemberFollowers(
  @Args('input') input: FollowInquiry,                                          // Filter, pagination ma'lumotlari
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Login bo'lsa ObjectId, bo'lmasa undefined
): Promise<Followers> {
  console.log('Query: getMemberFollowers');                                     // Debug log
  const { followingId } = input.search;                                         // Kimning followerlarini olish kerakligini ajratadi
  input.search.followingId = shapeIntoMongoObjectId(followingId);               // String → MongoDB ObjectId ga o'giradi
  return await this.followService.getMemberFollowers(memberId, input);          // Service ga uzatadi
}

}

