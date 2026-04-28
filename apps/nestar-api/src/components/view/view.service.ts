import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ViewInput } from '../../libs/dto/view/view.input';
import { View } from '../../libs/dto/view/view';
import { T } from '../../libs/types/common';
import { Properties } from '../../libs/dto/property/property';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: ViewInput): Promise<View | null> {
    const viewExist = await this.checkViewExistence(input);
    if (!viewExist) {
      console.log('-- New View Insert --');
      return await this.viewModel.create(input);
    } else return null;
  }

  private async checkViewExistence(input: ViewInput): Promise<View | null> {
    const { memberId, viewRefId } = input;
    const search: T = { memberId: memberId, viewRefId: viewRefId };
    return await this.viewModel.findOne(search).exec();
  }

  public async getVisitedProperties(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> { // Tashrif buyurgan propertylar ro'yxatini olish metodi
  const { page, limit } = input;                                                                       // Pagination parametrlarini ajratib oladi
  const match: T = { viewGroup: ViewGroup.PROPERTY, memberId: memberId };                             // Faqat PROPERTY guruhidagi va shu userning viewlari

  const data: T = await this.viewModel
    .aggregate([
      { $match: match },                                                                               // Filterlaydi
      { $sort: { updatedAt: -1 } },                                                                   // Yangi → eski tartibda saralaydi
      {
        $lookup: {                                                                                      // views → properties JOIN
          from: 'properties',                                                                          // properties collectionidan
          localField: 'viewRefId',                                                                     // view collectionidagi kalit maydon
          foreignField: '_id',                                                                         // properties collectionidagi mos maydon
          as: 'visitedProperty',                                                                       // Natija 'visitedProperty' nomi bilan qo'shiladi
        },
      },
      { $unwind: '$visitedProperty' },                                                                 // visitedProperty array → oddiy object
      {
        $facet: {                                                                                       // Parallel 2 ta hisoblash
          list: [
            { $skip: (page - 1) * limit },                                                            // Pagination: sahifani hisoblaydi
            { $limit: limit },                                                                         // Nechta qaytarishni cheklaydi
            lookupVisit,                                                                               // visitedProperty.memberData ni biriktiradi
            { $unwind: '$visitedProperty.memberData' },                                               // memberData array → oddiy object
          ],
          metaCounter: [{ $count: 'total' }],                                                          // Jami son
        },
      },
    ])
    .exec();

  const result: Properties = { list: [], metaCounter: data[0].metaCounter };                         // Natija obyektini tayyorlaydi
  result.list = data[0].list.map((ele) => ele.visitedProperty);                                       // Har bir elementdan visitedProperty ni ajratib oladi

  return result;                                                                                       // To'liq natijani qaytaradi
}


}