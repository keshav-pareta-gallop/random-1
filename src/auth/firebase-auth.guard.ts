import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private firebaseInitialized = false;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.substring(7);

    if (process.env.FIREBASE_AUTH_DISABLED === 'true') {
      request.user = {
        uid: 'smoke-test-user',
        name: 'Smoke Test',
        email: 'smoke@test.com',
      };
      return true;
    }

    try {
      this.ensureFirebaseInitialized();
      const decoded = await admin.auth().verifyIdToken(token);
      request.user = {
        uid: decoded.uid,
        name: decoded.name || decoded.email || 'Unknown',
        email: decoded.email || '',
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private ensureFirebaseInitialized(): void {
    if (!this.firebaseInitialized) {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      this.firebaseInitialized = true;
    }
  }
}
