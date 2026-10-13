import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast';

/** Turns API problem details into a readable toast; the error still propagates to the caller. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toasts = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      toasts.error(problemMessage(error));
      return throwError(() => error);
    }),
  );
};

export function problemMessage(error: HttpErrorResponse): string {
  const problem = error.error;
  if (error.status === 0) return 'Cannot reach the billing API.';
  if (problem?.errors) {
    // ASP.NET validation problem: { errors: { Field: ["message"] } }
    return Object.values(problem.errors as Record<string, string[]>).flat().join(' ');
  }
  return problem?.detail ?? problem?.title ?? `Request failed (${error.status}).`;
}
