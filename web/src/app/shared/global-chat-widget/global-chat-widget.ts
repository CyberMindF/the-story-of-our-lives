import { Component, ElementRef, ViewChild, afterNextRender, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GlobalChatService } from '../../core/global-chat.service';

@Component({
  selector: 'app-global-chat-widget',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './global-chat-widget.html',
  styleUrl: './global-chat-widget.css'
})
export class GlobalChatWidget {
  protected readonly chat = inject(GlobalChatService);
  protected readonly open = signal(false);
  protected readonly text = signal('');
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  protected readonly pendingFile = signal<File | null>(null);
  protected readonly pendingPreviewUrl = signal<string | null>(null);
  @ViewChild('log') private log?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  protected toggle(): void {
    this.open.update((value) => !value);
    this.chat.panelOpen.set(this.open());
    if (this.open()) {
      void this.chat.markRead();
      afterNextRender(() => this.scrollToBottom());
    }
  }

  protected async send(): Promise<void> {
    const body = this.text().trim();
    const file = this.pendingFile();
    if ((!body && !file) || this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    const sent = await this.chat.send(body, file ?? undefined);
    this.sending.set(false);
    if (!sent) {
      this.error.set('Non sono riuscito a inviare il messaggio.');
      return;
    }
    this.text.set('');
    this.clearPendingFile();
    afterNextRender(() => this.scrollToBottom());
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.error.set('Puoi allegare soltanto una foto o un video.');
      input.value = '';
      return;
    }
    const maxBytes = file.type.startsWith('image/') ? 15 * 1024 * 1024 : 200 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.error.set(`Il file supera la dimensione massima (${maxBytes / 1024 / 1024} MB).`);
      input.value = '';
      return;
    }
    this.clearPendingFile();
    this.pendingFile.set(file);
    this.pendingPreviewUrl.set(URL.createObjectURL(file));
  }

  protected clearPendingFile(): void {
    const preview = this.pendingPreviewUrl();
    if (preview) URL.revokeObjectURL(preview);
    this.pendingFile.set(null);
    this.pendingPreviewUrl.set(null);
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  protected mediaUrl = this.chat.mediaUrl.bind(this.chat);

  private scrollToBottom(): void {
    const element = this.log?.nativeElement;
    if (element) element.scrollTop = element.scrollHeight;
  }
}
