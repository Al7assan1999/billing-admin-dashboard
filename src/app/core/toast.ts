import { Component, Injectable, inject, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string) {
    this.push('success', text);
  }

  error(text: string) {
    this.push('error', text);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string) {
    const toast = { id: this.nextId++, kind, text };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 5000);
  }
}

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.error]="t.kind === 'error'" role="status">
          <span>{{ t.text }}</span>
          <button class="ghost" (click)="toasts.dismiss(t.id)" aria-label="Dismiss">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
