import { Injectable, signal } from '@angular/core';

export type SubmissionStatus = '' | 'success' | 'error';
type JsonResult = Record<string, unknown>;

interface FormSubmissionOptions {
  url: string;
  pendingMessage: string;
  successMessage: string | ((result: JsonResult) => string);
  fallbackError?: string;
  afterSuccess?: (result: JsonResult) => void | Promise<void>;
}

@Injectable()
export class FormSubmission {
  readonly submitting = signal(false);
  readonly status = signal<SubmissionStatus>('');
  readonly message = signal('');

  async submit(form: HTMLFormElement, options: FormSubmissionOptions): Promise<void> {
    this.submitting.set(true);
    this.status.set('');
    this.message.set(options.pendingMessage);

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        credentials: 'same-origin',
        body: new FormData(form)
      });
      const result = (await response.json().catch(() => ({}))) as JsonResult;
      if (!response.ok) {
        const message = typeof result['error'] === 'string' ? result['error'] : options.fallbackError;
        throw new Error(message || 'Invio non riuscito.');
      }

      form.reset();
      this.status.set('success');
      this.message.set(typeof options.successMessage === 'function' ? options.successMessage(result) : options.successMessage);
      await options.afterSuccess?.(result);
    } catch (error) {
      this.status.set('error');
      this.message.set(error instanceof Error ? error.message : options.fallbackError || 'Invio non riuscito.');
    } finally {
      this.submitting.set(false);
    }
  }
}
