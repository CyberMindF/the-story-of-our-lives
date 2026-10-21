import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pet-sprite',
  template: `
    <svg viewBox="0 0 300 270" role="img" [attr.aria-label]="label()" [attr.data-species]="species()">
      <ellipse cx="150" cy="240" rx="90" ry="12" fill="#6b5260" opacity=".12" />
      @if (egg()) {
        <g class="egg"><path d="M78 171 C78 99 121 39 150 39 S222 99 222 171 C222 253 78 253 78 171" fill="#fff4db" stroke="#e5d2ba" stroke-width="4" />
          <ellipse cx="115" cy="136" rx="12" ry="18" fill="#e9bdc7" transform="rotate(25 115 136)" /><ellipse cx="181" cy="181" rx="15" ry="19" fill="#c5d6cb" /><ellipse cx="159" cy="85" rx="10" ry="14" fill="#d3c8e1" />
          @if (cracks() > 0) { <path d="M95 185 L121 170 L143 190 L163 167 L186 180 L211 161" stroke="#ba9d80" stroke-width="3" fill="none" /> }
          @if (cracks() > 1) { <path d="M143 190 L135 214 M163 167 L169 143" stroke="#ba9d80" stroke-width="3" fill="none" /> }
        </g>
      } @else {
        @if (species() === 'porcupine') { <path d="M75 202 L49 169 L69 159 L43 129 L75 127 L58 92 L89 107 L91 66 L114 95 L139 62 L151 96 L179 65 L183 101 L215 81 L210 119 L245 109 L229 142 L257 160 L231 175 L247 207 Z" fill="#887468" stroke="#69594f" stroke-width="4" stroke-linejoin="round" /> }
        @if (species() === 'fox') { <path class="tail" d="M199 210 Q271 226 270 149 Q222 141 214 184 Z" fill="#cf8654" /><path d="M270 149 Q244 148 231 160 L254 183 Q270 171 270 149" fill="#fff4df" /> }
        @else if (species() !== 'duck' && species() !== 'porcupine' && species() !== 'rabbit') { <path class="tail" d="M205 217 Q277 229 253 166" fill="none" stroke="var(--fur-shadow)" stroke-width="23" stroke-linecap="round" /> }
        @if (species() === 'rabbit') { <circle cx="215" cy="201" r="22" fill="#fffaf3" /> }
        <ellipse cx="148" cy="192" rx="66" ry="46" fill="var(--fur-shadow)" />
        @if (species() === 'duck') {
          <ellipse cx="159" cy="193" rx="38" ry="24" fill="#f6d777" transform="rotate(-15 159 193)" />
          <path d="M109 229 L92 241 L136 241 M169 229 L159 241 L201 241" fill="#e5a04d" />
          <path d="M130 75 Q119 51 136 58 Q147 37 157 59 Q178 49 169 77" fill="#ffe9a1" />
        } @else {
          <ellipse cx="117" cy="228" rx="25" ry="12" fill="var(--fur)" /><ellipse cx="179" cy="228" rx="25" ry="12" fill="var(--fur)" />
          @if (species() === 'rabbit') {
            <ellipse cx="109" cy="69" rx="18" ry="57" fill="var(--fur)" transform="rotate(-12 109 69)" /><ellipse cx="187" cy="69" rx="18" ry="57" fill="var(--fur)" transform="rotate(12 187 69)" />
            <ellipse cx="109" cy="67" rx="8" ry="38" fill="#eac2c2" transform="rotate(-12 109 67)" /><ellipse cx="187" cy="67" rx="8" ry="38" fill="#eac2c2" transform="rotate(12 187 67)" />
          } @else if (species() === 'dog') {
            <ellipse cx="82" cy="125" rx="25" ry="53" fill="#9a765e" transform="rotate(12 82 125)" /><ellipse cx="216" cy="125" rx="25" ry="53" fill="#9a765e" transform="rotate(-12 216 125)" />
          } @else if (species() === 'porcupine') {
            <circle cx="97" cy="103" r="17" fill="#d5b8a3" /><circle cx="196" cy="103" r="17" fill="#d5b8a3" />
          } @else {
            <path d="M78 120 L79 52 Q101 58 120 82 L177 82 Q196 57 218 52 L216 125" fill="var(--fur)" stroke="var(--fur-shadow)" stroke-width="4" stroke-linejoin="round" />
            <path d="M89 67 L92 104 L113 88 Z M207 67 L182 88 L203 105 Z" fill="#eab9ba" />
          }
        }
        <ellipse cx="148" cy="132" rx="73" ry="57" fill="var(--fur)" />
        @if (species() === 'fox') { <path d="M78 131 Q104 133 148 169 Q192 133 218 131 Q208 183 148 186 Q87 181 78 131" fill="#fff2df" /> }
        <g class="eyes" fill="none" stroke="#51444b" stroke-width="5" stroke-linecap="round"><path d="M108 126 Q116 116 124 126" /><path d="M172 126 Q180 116 188 126" /></g>
        <ellipse cx="103" cy="144" rx="12" ry="7" fill="#eababa" /><ellipse cx="193" cy="144" rx="12" ry="7" fill="#eababa" />
        @if (species() === 'duck') { <ellipse cx="148" cy="148" rx="28" ry="12" fill="#e8a44b" /><path d="M124 148 L172 148" stroke="#be8038" stroke-width="2" /> }
        @else {
          <path d="M140 139 Q148 134 156 139 L148 147 Z" fill="#986c74" /><path d="M148 147 Q140 158 132 150 M148 147 Q156 158 164 150" fill="none" stroke="#7c626b" stroke-width="2.5" stroke-linecap="round" />
          @if (species() === 'cat' || species() === 'rabbit') { <path d="M95 143 L65 137 M95 151 L65 155 M201 143 L230 137 M201 151 L230 155" stroke="#c3b1ac" stroke-width="2" stroke-linecap="round" /> }
        }
      }
    </svg>`,
  styles: `:host{display:block;width:100%;height:100%}svg{width:100%;height:100%;overflow:visible;--fur:#fffaf3;--fur-shadow:#e9e0d8}svg[data-species=dog]{--fur:#e6c8a4;--fur-shadow:#d1ac83}svg[data-species=fox]{--fur:#e7a16b;--fur-shadow:#cd8554}svg[data-species=rabbit]{--fur:#ebe8ef;--fur-shadow:#d1cadb}svg[data-species=duck]{--fur:#ffe9a1;--fur-shadow:#f4d780}svg[data-species=porcupine]{--fur:#e4c9ae;--fur-shadow:#ad8e75}.tail{transform-origin:210px 210px;animation:wag 3s ease-in-out infinite}.egg{transform-origin:150px 235px;animation:wiggle 5s ease-in-out infinite}@keyframes wag{50%{transform:rotate(-9deg)}}@keyframes wiggle{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-4deg)}90%{transform:rotate(4deg)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}`
})
export class PetSprite {
  readonly species = input<string | null>('cat');
  readonly egg = input(false);
  readonly cracks = input(0);
  readonly label = input('Animaletto');
}
