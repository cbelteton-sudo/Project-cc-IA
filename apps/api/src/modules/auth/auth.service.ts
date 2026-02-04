import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        console.log('Login Attempt:', email);
        if (!user) {
            console.log('User not found');
            return null;
        }

        // Check password
        console.log('User found:', user.id);
        const isMatch = await bcrypt.compare(pass, user.password);
        console.log('Password Match:', isMatch);

        if (user && isMatch) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, tenantId: user.tenantId, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
