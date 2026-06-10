import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isPlatformServer(platformId)) {
    return true;
  }

  if (isPlatformBrowser(platformId) && authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
