import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, UseGuards,} from '@nestjs/common';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';

@Resolver()
export class MemberResolver {
    constructor(private readonly memberService: MemberService) {}


//==========================SIGNUP===================================
@Mutation(() => Member)
public async signup(@Args('input') input: MemberInput): Promise<Member> {
  console.log('Mutation: signup');
  return this.memberService.signup(input);
 
}


//=========================LOGIN=====================================
@Mutation(() => Member)
public async login(@Args('input') input: LoginInput): Promise<Member> {
 console.log('Mutation: login');
  return this.memberService.login(input);

}


//==========================UPDATEMEMBER===================================
//                         AUTHENTICATID
@UseGuards(AuthGuard)
@Mutation(() => String)
public async updateMember( @AuthMember('_id') memberId: mongoose.ObjectId): Promise<string> {
    console.log('Mutation: updateMember');
    return this.memberService.updateMember();
}
//=======================checkAuth================================================
@UseGuards(AuthGuard)
@Query(() => String)
public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
  console.log('Query: checkAuth');
  console.log('memberNick:', memberNick);
  return `Hi ${memberNick}`;
}

//=========================GETMEMBER========================================
@Mutation(() => String)
public async getMember():Promise<string> {
    console.log('Mutation: getMember');
    return this.memberService.getMember();
}


//=========================================================================
/** ADMIN **/

// Authorization: ADMIN
@Mutation(() => String)
public async getAllMembersByAdmin(): Promise<string> {
  return this.memberService.getAllMembersByAdmin();
}

//========================================================================
// Authorization: ADMIN
@Mutation(() => String)
public async updateMemberByAdmin(): Promise<string> {
  console.log('Mutation: updateMemberByAdmin');
  return this.memberService.updateMemberByAdmin();
}


}

