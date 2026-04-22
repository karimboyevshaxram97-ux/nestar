import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import * as mongoose from 'mongoose';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
	@IsNotEmpty()
	@Field(() => String)
	memberId: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	likeRefId: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => LikeGroup)
	likeGroup: LikeGroup;
}
