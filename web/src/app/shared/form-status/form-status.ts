import { Component, Input } from '@angular/core';
import { SubmissionStatus } from '../form-submission/form-submission';

@Component({
  selector: 'app-form-status',
  standalone: true,
  styles: ':host { display: contents; }',
  templateUrl: './form-status.html'
})
export class FormStatus {
  @Input() message = '';
  @Input() status: SubmissionStatus = '';
  @Input() extraClass = '';
}
