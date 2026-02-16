import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BoardGateway } from './board.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { envConfigService } from 'src/config/env-config.service';

@Module({
    imports: [
        JwtModule.register({
            secret: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
    ],
    providers: [BoardGateway, WsJwtGuard],
    exports: [BoardGateway],
})
export class WebSocketModule {}
