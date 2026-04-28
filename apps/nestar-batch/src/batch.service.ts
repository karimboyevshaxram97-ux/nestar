import { Injectable } from '@nestjs/common';                                    // NestJS DI uchun
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/nestar-api/src/libs/dto/member/member';
import { Property } from 'apps/nestar-api/src/libs/dto/property/property';
import { MemberStatus, MemberType } from 'apps/nestar-api/src/libs/enums/member.enum';
import { PropertyStatus } from 'apps/nestar-api/src/libs/enums/property.enum';
import { Model } from 'mongoose';

@Injectable()                                                                   // NestJS DI uchun belgi
export class BatchService {
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<Property>, // 'Property' MongoDB modelini inject qiladi
    @InjectModel('Member') private readonly memberModel: Model<Member>,       // 'Member' MongoDB modelini inject qiladi
  ) {}

 //==========================================================
  public async batchRollback(): Promise<void> {
  await this.propertyModel
    .updateMany(
      { propertyStatus: PropertyStatus.ACTIVE },                               // Barcha ACTIVE propertylarni topadi
      { propertyRank: 0 },                                                     // propertyRank ni 0 ga tushiradi (reset)
    )
    .exec();

  await this.memberModel
    .updateMany(
      {
        memberStatus: MemberStatus.ACTIVE,                                     // Barcha ACTIVE memberlarni topadi
        memberType: MemberType.AGENT,                                          // Faqat AGENT turini
      },
      { memberRank: 0 },                                                       // memberRank ni 0 ga tushiradi (reset)
    )
    .exec();
  }
  //========================================================
  public async batchTopProperties(): Promise<void> {
  const properties: Property[] = await this.propertyModel
    .find({
      propertyStatus: PropertyStatus.ACTIVE,                                   // Faqat ACTIVE propertylarni topadi
      propertyRank: 0,                                                         // Faqat rank 0 bo'lganlarni (hali hisoblanmaganlar)
    })
    .exec();

  const promisedList = properties.map(async (ele: Property) => {              // Har bir property uchun rank hisoblaydi
    const { _id, propertyLikes, propertyViews } = ele;                        // Kerakli maydonlarni ajratib oladi
    const rank = propertyLikes * 2 + propertyViews * 1;                       // Rank formulasi: like x2 + view x1
    return await this.propertyModel.findByIdAndUpdate(_id, { propertyRank: rank }); // Hisoblangan rankni DBga saqlaydi
   });
    await Promise.all(promisedList);                                             // Barcha update lar parallel bajariladi
  }
 //============================================================
  public async batchTopAgents(): Promise<void> {
  const agents: Member[] = await this.memberModel
    .find({
      memberType: MemberType.AGENT,                                            // Faqat AGENT turini topadi
      memberStatus: MemberStatus.ACTIVE,                                       // Faqat ACTIVE memberlarni
      memberRank: 0,                                                           // Faqat rank 0 bo'lganlarni (hali hisoblanmaganlar)
    })
    .exec();

  const promisedList = agents.map(async (ele: Member) => {                    // Har bir agent uchun rank hisoblaydi
    const { _id, memberProperties, memberLikes, memberArticles, memberViews } = ele; // Kerakli maydonlarni ajratib oladi
    const rank = memberProperties * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1; // Rank formulasi: property x4 + article x3 + like x2 + view x1
    return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank }); // Hisoblangan rankni DBga saqlaydi
  });
  await Promise.all(promisedList);                                             // Barcha update lar parallel bajariladi
}
 //============================================================
   public getHello(): string {                                                   // Salomlashish metodi
    return 'Welcome to Nestar BATCH Server!';                                  // Batch server salom xabari
  }

}