import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';

@Injectable()
export class LikeService {
     constructor(
          @InjectModel('Member') private readonly memberModel: Model<Member>){}
}
