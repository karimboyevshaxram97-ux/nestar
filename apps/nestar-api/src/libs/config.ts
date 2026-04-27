import { ObjectId } from 'bson';                                                // MongoDB ObjectId klassi (bson kutubxonasidan)

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank']; // Agent uchun ruxsat etilgan sort maydonlari
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];              // Member uchun ruxsat etilgan sort maydonlari
export const availableOptions = ['propertyBarter', 'propertyRent'];                                        // Property qo'shimcha opsiyalari
export const availablePropertySorts = [                                                                    // Property uchun ruxsat etilgan sort maydonlari
  'createdAt',                                                                 // Yaratilgan vaqt bo'yicha
  'updatedAt',                                                                 // Yangilangan vaqt bo'yicha
  'propertyLikes',                                                             // Like soni bo'yicha
  'propertyViews',                                                             // Ko'rishlar soni bo'yicha
  'propertyRank',                                                              // Reyting bo'yicha
  'propertyPrice',                                                             // Narx bo'yicha
];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];      // BoardArticle uchun ruxsat etilgan sort maydonlari
export const availableCommentSorts = ['createdAt', 'updatedAt'];                                           // Comment uchun ruxsat etilgan sort maydonlari

/** IMAGE CONFIGURATION **/
import { v4 as uuidv4 } from 'uuid';                                          // Noyob ID generatsiya qilish uchun
import * as path from 'path';                                                  // Fayl yo'li bilan ishlash uchun
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];        // Ruxsat etilgan rasm formatlari
export const getSerialForImage = (filename: string) => {                       // Rasm uchun noyob fayl nomi yaratadi
  const ext = path.parse(filename).ext;                                        // Faylning kengaytmasini oladi (.png, .jpg ...)
  return uuidv4() + ext;                                                       // uuid + kengaytma → noyob fayl nomi (masalan: a1b2c3d4.jpg)
};

export const shapeIntoMongoObjectId = (target: any) => {                       // String → MongoDB ObjectId ga o'giruvchi funksiya
  return typeof target === 'string' ? new ObjectId(target) : target;          // String bo'lsa → ObjectId ga o'giradi, aks holda o'zini qaytaradi
};

//===============================================================
export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => { // Login user like bosganmi tekshiruvchi $lookup
  return {
    $lookup: {
      from: 'likes',                                                             // 'likes' collectionidan qidiradi
      let: {                                                                     // Lokal o'zgaruvchilar e'lon qilinadi
        localLikeRefId: targetRefId,                                            // Qaysi hujjatni like bosganligini tekshirish uchun
        localMemberId: memberId,                                                 // Qaysi user like bosganligini tekshirish uchun
        localMyFavorite: true,                                                   // myFavorite qiymatini true deb belgilaydi
      },
      pipeline: [                                                                // Like collectionida qidirish shartlari
        {
          $match: {
            $expr: {
              $and: [                                                            // Ikki shart ham bajarilishi kerak
                { $eq: ['$likeRefId', '$$localLikeRefId'] },                   // likeRefId === targetRefId
                { $eq: ['$memberId', '$$localMemberId'] },                     // memberId === memberId
              ],
            },
          },
        },
        {
          $project: {                                                            // Qaytariladigan maydonlarni belgilaydi
            _id: 0,                                                             // _id ni olib tashaydi
            memberId: 1,                                                        // memberId ni qaytaradi
            likeRefId: 1,                                                       // likeRefId ni qaytaradi
            myFavorite: '$$localMyFavorite',                                    // myFavorite = true
          },
        },
      ],
      as: 'meLiked',                                                            // Natija 'meLiked' nomi bilan qo'shiladi
    },
  };
};

//=======================================================

interface LookupAuthMemberFollowed {                                             // Input interface si
  followerId: T;                                                                 // Kuzatuvchi member ID si
  followingId: string;                                                           // Kuzatilayotgan member ID si (string)
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => { // Login user kuzatayaptimi tekshiruvchi $lookup
  const { followerId, followingId } = input;                                    // Input dan ajratib oladi
  return {
    $lookup: {
      from: 'follows',                                                           // 'follows' collectionidan qidiradi
      let: {                                                                     // Lokal o'zgaruvchilar e'lon qilinadi
        localFollowerId: followerId,                                             // Kuzatuvchi member ID si
        localFollowingId: followingId,                                           // Kuzatilayotgan member ID si
        localMyFavorite: true,                                                   // myFavorite qiymatini true deb belgilaydi
      },
      pipeline: [                                                                // follows collectionida qidirish shartlari
        {
          $match: {
            $expr: {
              $and: [                                                            // Ikki shart ham bajarilishi kerak
                { $eq: ['$followerId', '$$localFollowerId'] },                  // followerId === localFollowerId
                { $eq: ['$followingId', '$$localFollowingId'] },               // followingId === localFollowingId
              ],
            },
          },
        },
        {
          $project: {                                                            // Qaytariladigan maydonlarni belgilaydi
            _id: 0,                                                             // _id ni olib tashaydi
            followerId: 1,                                                      // followerId ni qaytaradi
            followingId: 1,                                                     // followingId ni qaytaradi
            myFollowing: '$$localMyFavorite',                                    // myFavorite = true
          },
        },
      ],
      as: 'meFollowed',                                                         // Natija 'meFollowed' nomi bilan qo'shiladi
    },
  };
};

//=======================================================

export const lookupMember = {                                                  // MongoDB $lookup pipeline — member ma'lumotlarini biriktiradi
  $lookup: {                                                                   // SQL dagi JOIN ga o'xshash
    from: 'members',                                                           // 'members' collectionidan qidiradi
    localField: 'memberId',                                                    // Joriy collectiondagi kalit maydon
    foreignField: '_id',                                                       // members collectionidagi mos maydon
    as: 'memberData',                                                          // Natija 'memberData' nomi bilan qo'shiladi (array)
  },
};


  export const lookupFollowingData = {                // Kuzatilayotgan member ma'lumotlarini biriktiradi
  $lookup: {                                        // SQL dagi JOIN ga o'xshash
    from: 'members',                               // 'members' collectionidan qidiradi
    localField: 'followingId',                     // Joriy collectiondagi kalit maydon
    foreignField: '_id',                           // members collectionidagi mos maydon
    as: 'followingData',                           // Natija 'followingData' nomi bilan qo'shiladi (array)
  },
};

export const lookupFollowerData = {                 // Kuzatuvchi member ma'lumotlarini biriktiradi
  $lookup: {                                        // SQL dagi JOIN ga o'xshash
    from: 'members',                               // 'members' collectionidan qidiradi
    localField: 'followerId',                      // Joriy collectiondagi kalit maydon
    foreignField: '_id',                           // members collectionidagi mos maydon
    as: 'followerData',                            // Natija 'followerData' nomi bilan qo'shiladi (array)
  },
};


export const lookupFavorite = {
  $lookup: {
    from: 'members',                                        // 'members' collectionidan qidiradi
    localField: 'favoriteProperty.memberId',               // favoriteProperty ichidagi memberId
    foreignField: '_id',                                   // members collectionidagi mos maydon
    as: 'favoriteProperty.memberData',                     // Natija favoriteProperty.memberData ga qo'shiladi
  },
};
