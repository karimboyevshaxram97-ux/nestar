import { Resolver } from '@nestjs/graphql';                              // GraphQL Resolver uchun
import { FollowService } from './follow.service';                        // Follow business logic service

@Resolver()                                                              // Bu class GraphQL Resolver ekanligini bildiradi
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}         // FollowService ni inject qiladi
}