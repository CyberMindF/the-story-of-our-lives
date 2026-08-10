import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

// Campo password mascherato con occhiolino mostra/nascondi, condiviso tra Portone e
// Profilo (prima esisteva solo dentro Portone — estratto per non duplicarlo, vedi CLAUDE.md).
// Resta type="text" con -webkit-text-security (password-field.css): stesso trucco già
// usato in access-gate.css per non far classificare il campo come password al browser.
@Component({
  selector: 'app-password-field',
  standalone: true,
  styleUrls: ['../../../styles/components/password-field.css'],
  templateUrl: './password-field.html'
})
export class PasswordField {
  @Input() value = '';
  @Output() readonly valueChange = new EventEmitter<string>();
  @Input() name = 'password';
  @Input() autocomplete = 'off';
  @Input() required = true;
  @Input() minlength: number | null = 8;

  protected readonly showPassword = signal(false);

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value = next;
    this.valueChange.emit(next);
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((value) => !value);
  }
}
