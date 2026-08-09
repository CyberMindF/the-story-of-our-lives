import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styleUrls: ['../../../../asset-root/assets/css/pages/not-found.css'],
  templateUrl: './not-found.html'
})
export class NotFound {}
