import { Module } from '@nestjs/common';          // NestJS modul dekoratori va Module class'i
import { AuthService } from './auth.service';     // Auth bilan bog'liq business-logic (login/register, token)
import { HttpModule } from '@nestjs/axios';       // HTTP request qilish uchun (axios wrapper)
import { JwtModule } from '@nestjs/jwt';          // JWT token yaratish/tekshirish uchun modul

@Module({
  imports: [
    HttpModule,                               
    JwtModule.register({                        
      secret: `${process.env.SECRET_TOKEN}`,    
     signOptions: { expiresIn: '30d'}
    }),
  ],

  providers: [AuthService],                       // DI orqali AuthService'ni provider sifatida qo'shadi
  exports: [AuthService],                         // Boshqa modullar AuthModule import qilsa AuthService'ni ishlata oladi
})
export class AuthModule {}                        // Auth moduli (controller bo'lishi ham mumkin)