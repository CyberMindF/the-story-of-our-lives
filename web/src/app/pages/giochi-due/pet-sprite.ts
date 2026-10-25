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
      } @else if (species() === 'fire') {
        <g class="pet-character fire-character">
          <ellipse cx="116" cy="227" rx="25" ry="11" fill="#d96838" /><ellipse cx="184" cy="227" rx="25" ry="11" fill="#d96838" />
          <path d="M150 232 C102 232 78 204 88 167 C94 145 111 130 108 99 C128 109 137 92 143 60 C162 78 167 102 164 120 C179 109 190 94 189 76 C211 99 224 132 215 166 C230 154 235 143 235 129 C249 166 240 204 207 224 C192 233 169 236 150 232 Z" fill="#ef6b35" stroke="#bd4a31" stroke-width="4" stroke-linejoin="round" />
          <path class="flame-inner" d="M151 218 C124 218 109 199 115 178 C120 161 135 154 135 132 C151 142 157 155 154 169 C168 159 177 148 176 136 C192 157 197 182 187 199 C179 212 166 218 151 218 Z" fill="#ffc84d" />
          <g class="cute-face" fill="none" stroke="#5f3839" stroke-width="5" stroke-linecap="round"><path d="M116 164 Q125 153 134 164" /><path d="M169 164 Q178 153 187 164" /><path d="M139 184 Q151 194 163 184" /></g>
          <ellipse cx="111" cy="181" rx="11" ry="7" fill="#ff9a83" opacity=".75" /><ellipse cx="192" cy="181" rx="11" ry="7" fill="#ff9a83" opacity=".75" />
          <path d="M91 185 Q72 179 68 164 M210 185 Q229 179 233 164" fill="none" stroke="#bd4a31" stroke-width="5" stroke-linecap="round" />
        </g>
      } @else if (species() === 'mushroom') {
        <g class="pet-character mushroom-character">
          <ellipse cx="116" cy="228" rx="25" ry="11" fill="#e7cfb2" /><ellipse cx="184" cy="228" rx="25" ry="11" fill="#e7cfb2" />
          <path d="M112 122 C112 105 188 105 188 122 L194 205 Q194 229 172 231 L128 231 Q106 229 106 205 Z" fill="#f5dfc2" stroke="#b99b82" stroke-width="4" />
          <path d="M55 128 C61 71 101 43 150 43 C199 43 239 71 245 128 C214 142 86 142 55 128 Z" fill="#d96864" stroke="#9f494b" stroke-width="4" stroke-linejoin="round" />
          <ellipse cx="100" cy="93" rx="18" ry="13" fill="#ffd9c9" transform="rotate(-20 100 93)" /><circle cx="158" cy="72" r="16" fill="#ffd9c9" /><ellipse cx="205" cy="105" rx="17" ry="12" fill="#ffd9c9" transform="rotate(24 205 105)" />
          <g class="cute-face" fill="none" stroke="#5a4545" stroke-width="5" stroke-linecap="round"><path d="M121 169 Q130 159 139 169" /><path d="M161 169 Q170 159 179 169" /><path d="M140 188 Q150 196 160 188" /></g>
          <ellipse cx="116" cy="185" rx="10" ry="6" fill="#e9a6a2" /><ellipse cx="184" cy="185" rx="10" ry="6" fill="#e9a6a2" />
          <path d="M108 187 Q86 181 80 166 M192 187 Q214 181 220 166" fill="none" stroke="#b99b82" stroke-width="5" stroke-linecap="round" />
        </g>
      } @else if (species() === 'rock') {
        <g class="pet-character rock-character">
          <ellipse cx="111" cy="229" rx="27" ry="10" fill="#8f8791" /><ellipse cx="189" cy="229" rx="27" ry="10" fill="#8f8791" />
          <path d="M70 207 L78 139 L105 92 L158 72 L207 96 L232 150 L222 211 Q188 232 148 233 Q103 232 70 207 Z" fill="#a9a3ad" stroke="#77717c" stroke-width="5" stroke-linejoin="round" />
          <path d="M105 92 L120 126 L78 139 M158 72 L155 112 L207 96 M232 150 L190 157 L222 211 M70 207 L111 187 L148 233" fill="none" stroke="#c7c2ca" stroke-width="4" opacity=".75" />
          <circle cx="101" cy="152" r="8" fill="#8f8993" /><circle cx="199" cy="124" r="6" fill="#8f8993" /><circle cx="187" cy="202" r="7" fill="#8f8993" />
          <g class="cute-face" fill="none" stroke="#49454d" stroke-width="6" stroke-linecap="round"><path d="M111 166 Q121 154 131 166" /><path d="M169 166 Q179 154 189 166" /><path d="M139 188 Q150 197 161 188" /></g>
          <ellipse cx="105" cy="185" rx="11" ry="7" fill="#d49da8" opacity=".8" /><ellipse cx="195" cy="185" rx="11" ry="7" fill="#d49da8" opacity=".8" />
          <path d="M76 180 Q57 176 53 162 M224 180 Q243 176 247 162" fill="none" stroke="#77717c" stroke-width="6" stroke-linecap="round" />
        </g>
      } @else if (species() === 'water') {
        <g class="pet-character water-character">
          <ellipse cx="116" cy="228" rx="24" ry="10" fill="#4d9fc5" /><ellipse cx="184" cy="228" rx="24" ry="10" fill="#4d9fc5" />
          <path d="M150 40 C142 72 83 126 83 177 C83 217 113 236 150 236 C187 236 217 217 217 177 C217 126 158 72 150 40 Z" fill="#65c9ec" stroke="#3285ad" stroke-width="5" />
          <path class="water-highlight" d="M129 83 C111 111 99 135 99 160 C99 174 103 184 109 191" fill="none" stroke="#d9f7ff" stroke-width="12" stroke-linecap="round" opacity=".8" />
          <g class="cute-face" fill="none" stroke="#245a75" stroke-width="5" stroke-linecap="round"><path d="M111 166 Q121 155 131 166" /><path d="M169 166 Q179 155 189 166" /><path d="M139 188 Q150 197 161 188" /></g>
          <ellipse cx="105" cy="184" rx="11" ry="7" fill="#9ce3ef" /><ellipse cx="195" cy="184" rx="11" ry="7" fill="#9ce3ef" />
          <path d="M86 184 Q66 180 61 165 M214 184 Q234 180 239 165" fill="none" stroke="#3285ad" stroke-width="5" stroke-linecap="round" />
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
  styles: `
    :host{display:block;width:100%;height:100%}
    svg{width:100%;height:100%;overflow:visible;--fur:#fffaf3;--fur-shadow:#e9e0d8}
    svg[data-species=dog]{--fur:#e6c8a4;--fur-shadow:#d1ac83}
    svg[data-species=fox]{--fur:#e7a16b;--fur-shadow:#cd8554}
    svg[data-species=rabbit]{--fur:#ebe8ef;--fur-shadow:#d1cadb}
    svg[data-species=duck]{--fur:#ffe9a1;--fur-shadow:#f4d780}
    svg[data-species=porcupine]{--fur:#e4c9ae;--fur-shadow:#ad8e75}
    .tail{transform-origin:210px 210px;animation:wag 3s ease-in-out infinite}
    .egg{transform-origin:150px 235px;animation:wiggle 5s ease-in-out infinite}
    .pet-character{transform-origin:150px 232px;animation:pet-bob 3.4s ease-in-out infinite}
    .fire-character{animation-duration:2.2s}
    .flame-inner{transform-origin:151px 215px;animation:flame-flicker 1.4s ease-in-out infinite}
    .mushroom-character{animation-name:mushroom-sway;animation-duration:4s}
    .rock-character{animation-name:rock-hop;animation-duration:4.6s}
    .water-character{animation-name:water-breathe;animation-duration:3s}
    .water-highlight{animation:water-shine 3s ease-in-out infinite}
    @keyframes wag{50%{transform:rotate(-9deg)}}
    @keyframes wiggle{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-4deg)}90%{transform:rotate(4deg)}}
    @keyframes pet-bob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.015,.985)}}
    @keyframes flame-flicker{0%,100%{transform:scale(1) rotate(-1deg)}50%{transform:scale(.94,1.06) rotate(2deg)}}
    @keyframes mushroom-sway{0%,100%{transform:rotate(-1deg)}50%{transform:translateY(-4px) rotate(1.5deg)}}
    @keyframes rock-hop{0%,72%,100%{transform:translateY(0) rotate(0)}78%{transform:translateY(-9px) rotate(-2deg)}84%{transform:translateY(0) rotate(1deg)}}
    @keyframes water-breathe{0%,100%{transform:scale(1)}50%{transform:translateY(-4px) scale(1.035,.97)}}
    @keyframes water-shine{0%,100%{opacity:.55}50%{opacity:1}}
    @media(prefers-reduced-motion:reduce){*{animation:none!important}}
  `
})
export class PetSprite {
  readonly species = input<string | null>('cat');
  readonly egg = input(false);
  readonly cracks = input(0);
  readonly label = input('Animaletto');
}
