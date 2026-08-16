import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { ContentService } from '../../../core/content.service';
import { ConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-modals',
  standalone: true,
  imports: [ConfirmationDialog],
  host: { style: 'display: contents' },
  styleUrls: ['../../../../styles/components/modal.css'],
  templateUrl: './crossword-modals.html'
})
export class CrosswordModals implements OnDestroy {
  protected readonly completionLetter = `Hey! Complimenti per aver completato il cruciverba! Spero non sia stato troppo difficile ahaha. Dovresti ricordarti le nostre cose 😒. Mi è venuta questa idea il giorno che ero a quella festa di laurea, quella in cui c'era Desy, Perfect e chi più ne ha più ne metta ahaha. Da quel giorno un'idea ha tirato l'altra, ed è nata anche l'idea di portare il nostro mondo allo step successivo, quello che probabilmente meritava da subito ahaha. Lo so, forse un po' deludente il fatto che la tua ricompensa per averlo finito sia l'ennesima letterina ahaha, ma vedi il lato positivo, forse la vera ricompensa non è questa lettera, ma tutti i ricordi che abbiamo ricordato insieme, io mentre creavo questo cruciverba e tu mentre lo facevi. Spero che sia stato bello anche per te e che sia stato un piccolo viaggio nel passato e che hai rivisto cose che forse ti eri anche dimenticata. Beh che dire adesso? È difficile scrivere una lettera in modo che sia "senza tempo" sai ahaha? Magari non hai completato questo cruciverba subito e magari adesso qualcosa è diverso, chi lo sa ahaha. Sicuramente posso dirti che per me sei una persona davvero speciale e che ti voglio un bene dell'anima. Spero che passeremo ancora tanti di quei giorni, spero che creeremo tanti altri ricordi stupendi, come quelli che abbiamo già, ma perché no? Anche di più belli. E spero che un giorno saranno così tanti che ci sarà bisogno di un secondo cruciverba ahaha. Beh comunque come sempre vorrei dirti davvero tante cose, ma questo è solo un cruciverba e non c'è bisogno che te le dica qui. Spero che tu ti sia divertita a completarlo, perché io mi sono divertito a crearlo ahaha. Quindi insomma, ancora complimenti e buona continuazione nel mondo bianco! Ti voglio benissimo piccolina mia ❤️‍🔥`;
  protected readonly displayedCompletionLetter = signal('');
  protected readonly writingCompletionLetter = signal(false);

  private readonly contentService = inject(ContentService);
  protected readonly loadedCompletionLetter = signal(this.completionLetter);
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private typingRun = 0;

  constructor(protected readonly crossword: CrosswordService) {
    effect(() => {
      if (this.crossword.completionModalOpen()) {
        this.startCompletionLetter();
      } else {
        this.stopTyping();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTyping();
  }

  private async startCompletionLetter(): Promise<void> {
    this.stopTyping();
    const typingRun = ++this.typingRun;

    try {
      const entry = await this.contentService.load('cruciverba.lettera-finale');
      if (entry.body.trim()) {
        this.loadedCompletionLetter.set(entry.body.trim());
      }
    } catch (error) {
      console.warn('Impossibile caricare la lettera finale, uso il testo incluso nella pagina:', error);
    }

    if (typingRun !== this.typingRun || !this.crossword.completionModalOpen()) {
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.displayedCompletionLetter.set(this.loadedCompletionLetter());
      return;
    }

    const characters = Array.from(this.loadedCompletionLetter());
    let index = 0;
    this.displayedCompletionLetter.set('');
    this.writingCompletionLetter.set(true);

    const writeNextCharacter = (): void => {
      index += 1;
      this.displayedCompletionLetter.set(characters.slice(0, index).join(''));

      if (index >= characters.length) {
        this.writingCompletionLetter.set(false);
        this.typingTimer = null;
        return;
      }

      this.typingTimer = setTimeout(writeNextCharacter, 24);
    };

    this.typingTimer = setTimeout(writeNextCharacter, 350);
  }

  private stopTyping(): void {
    this.typingRun += 1;
    if (this.typingTimer !== null) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.writingCompletionLetter.set(false);
  }

  protected onCompletionBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeCompletionModal();
    }
  }

  protected onHintBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeHintModal();
    }
  }
}
