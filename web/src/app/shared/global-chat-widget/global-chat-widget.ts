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
  @ViewChild('log') private log?: ElementRef<HTMLElement>;

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
    if (!body || this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    const sent = await this.chat.sendText(body);
    this.sending.set(false);
    if (!sent) {
      this.error.set('Non sono riuscito a inviare il messaggio.');
      return;
    }
    this.text.set('');
    afterNextRender(() => this.scrollToBottom());
  }

  protected mediaUrl = this.chat.mediaUrl.bind(this.chat);

  private scrollToBottom(): void {
    const element = this.log?.nativeElement;
    if (element) element.scrollTop = element.scrollHeight;
  }
}
