import { Field, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/like.enum';
import * as mongoose from 'mongoose';

@ObjectType()
export class MeLiked {
	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String)
	likeRefId: mongoose.ObjectId;

	@Field(() => Boolean)
	myFavorite: boolean;
}

@ObjectType()
export class Like {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => LikeGroup)
	likeGroup: LikeGroup;

	@Field(() => String)
	likeRefId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}


