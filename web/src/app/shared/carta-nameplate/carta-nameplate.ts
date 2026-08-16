import { Component, Input } from '@angular/core';

// Unico pie' di carta per tutte le finiture. Vive sopra materiale, illustrazione e riflessi:
// CartaTilt lo monta una sola volta, indipendentemente dalla famiglia della carta.
@Component({
  selector: 'app-carta-nameplate',
  standalone: true,
  templateUrl: './carta-nameplate.html',
  styleUrl: './carta-nameplate.css'
})
export class CartaNameplate {
  @Input() nome = '';
}
