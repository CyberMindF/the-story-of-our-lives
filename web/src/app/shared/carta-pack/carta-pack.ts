import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-carta-pack',
  standalone: true,
  templateUrl: './carta-pack.html',
  styleUrl: './carta-pack.css'
})
export class CartaPack {
  @Input() size: 'icon' | 'display' | 'opening' = 'icon';
  @Input() opening = false;

  @HostBinding('class.is-display')
  protected get isDisplay(): boolean {
    return this.size === 'display';
  }

  @HostBinding('class.is-opening')
  protected get isOpening(): boolean {
    return this.size === 'opening' || this.opening;
  }
}
