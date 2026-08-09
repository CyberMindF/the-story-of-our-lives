import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-ipdv-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrls: ['./ipdv-navigation.css'],
  templateUrl: './ipdv-navigation.html'
})
export class IpdvNavigation {}
