import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom, take } from 'rxjs';
import { AdminContentService } from './admin-content.service';

export const nonAdminOnlyGuard: CanMatchFn = async () => {
  const auth = inject(AngularFireAuth);
  const content = inject(AdminContentService);
  const router = inject(Router);
  const user = await firstValueFrom(auth.authState.pipe(take(1)));

  if (!user || user.isAnonymous) {
    return true;
  }

  try {
    return await content.isAdmin(user.uid) ? router.createUrlTree(['/admin']) : true;
  } catch (error) {
    console.error('Could not verify admin role before opening the user app:', error);
    return true;
  }
};
