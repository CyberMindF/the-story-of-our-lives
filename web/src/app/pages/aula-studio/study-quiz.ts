import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudyFocusService } from '../../core/study-focus.service';
import { AppShell } from '../../shell/app-shell';

type QuestionType = 'single' | 'multiple' | 'open';
type Assessment = 'correct' | 'incorrect' | null;

interface QuizOption {
  id: number;
  text: string;
  correct: boolean;
}
interface QuizQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  referenceAnswer: string | null;
  options: QuizOption[];
}
interface QuizSnapshot {
  quizId: number;
  title: string;
  correctionMode: 'immediate' | 'final';
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: QuizQuestion[];
}
interface QuestionAnswer {
  selectedOptionIds?: number[];
  text?: string;
  corrected?: boolean;
  revealed?: boolean;
  assessment?: Assessment;
}
interface AttemptAnswers {
  finalCorrectionShown: boolean;
  byQuestion: Record<number, QuestionAnswer>;
}
interface QuizAttempt {
  id: string;
  quizId: number;
  userId: number;
  nickname?: string;
  status: 'in_progress' | 'completed';
  snapshot: QuizSnapshot;
  answers: AttemptAnswers;
  correctCount: number;
  assessedCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

@Component({
  selector: 'app-study-quiz',
  standalone: true,
  imports: [AppShell, CommonModule, DatePipe, FormsModule, RouterLink],
  styleUrls: ['../../../styles/pages/study-quiz.css'],
  templateUrl: './study-quiz.html',
})
export class StudyQuiz implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly focusMode = inject(StudyFocusService);
  protected readonly attempt = signal<QuizAttempt | null>(null);
  protected readonly history = signal<QuizAttempt[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly resumed = signal(false);
  protected readonly copiedMessage = signal('');
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly snapshot = computed(() => this.attempt()?.snapshot ?? null);
  protected readonly canComplete = computed(() => {
    const current = this.attempt();
    return Boolean(current && current.assessedCount === current.snapshot.questions.length);
  });

  async ngOnInit(): Promise<void> {
    this.focusMode.enterPage();
    const quizId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(quizId) || quizId < 1) {
      this.error.set('Quiz non valido.');
      this.loading.set(false);
      return;
    }
    await this.start(quizId);
  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.attempt()?.status === 'in_progress') void this.save('save', undefined, false);
    this.focusMode.leavePage();
  }

  protected answerFor(question: QuizQuestion): QuestionAnswer {
    return this.attempt()?.answers.byQuestion[question.id] ?? {};
  }

  protected isSelected(question: QuizQuestion, optionId: number): boolean {
    return this.answerFor(question).selectedOptionIds?.includes(optionId) ?? false;
  }

  protected selectOption(question: QuizQuestion, optionId: number, selected: boolean): void {
    if (this.isLocked(question)) return;
    this.mutateAnswer(question.id, (answer) => {
      const existing = answer.selectedOptionIds ?? [];
      answer.selectedOptionIds =
        question.type === 'single'
          ? selected
            ? [optionId]
            : []
          : selected
            ? [...new Set([...existing, optionId])]
            : existing.filter((id) => id !== optionId);
    });
  }

  protected updateOpenAnswer(questionId: number, text: string): void {
    this.mutateAnswer(questionId, (answer) => {
      answer.text = text;
    });
  }

  protected isLocked(question: QuizQuestion): boolean {
    const current = this.attempt();
    const answer = this.answerFor(question);
    return (
      current?.status === 'completed' ||
      (question.type === 'open' ? answer.revealed === true : answer.corrected === true)
    );
  }

  protected canCorrectQuestion(question: QuizQuestion): boolean {
    const answer = this.answerFor(question);
    return (
      question.type !== 'open' && !answer.corrected && (answer.selectedOptionIds?.length ?? 0) > 0
    );
  }

  protected isQuestionCorrect(question: QuizQuestion): boolean {
    if (question.type === 'open') return this.answerFor(question).assessment === 'correct';
    const selected = [...(this.answerFor(question).selectedOptionIds ?? [])].sort((a, b) => a - b);
    const correct = question.options
      .filter((option) => option.correct)
      .map((option) => option.id)
      .sort((a, b) => a - b);
    return (
      selected.length === correct.length && selected.every((id, index) => id === correct[index])
    );
  }

  protected async correctQuestion(question: QuizQuestion): Promise<void> {
    await this.save('correctQuestion', question.id);
  }

  protected async correctQuiz(): Promise<void> {
    await this.save('correctQuiz');
  }
  protected async revealOpen(question: QuizQuestion): Promise<void> {
    await this.save('revealOpen', question.id);
  }
  protected async assessOpen(
    question: QuizQuestion,
    assessment: Exclude<Assessment, null>,
  ): Promise<void> {
    await this.save('assessOpen', question.id, true, assessment);
  }
  protected async complete(): Promise<void> {
    await this.save('complete');
    await this.loadHistory(this.attempt()?.quizId ?? 0);
  }

  protected async restart(): Promise<void> {
    const current = this.attempt();
    if (!current) return;
    if (
      current.status === 'in_progress' &&
      !window.confirm('Eliminare la bozza corrente e ricominciare?')
    )
      return;
    if (current.status === 'in_progress')
      await fetch(`/api/study-quiz-attempts/${current.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
    await this.start(current.quizId);
  }

  protected async copyQuestion(question: QuizQuestion): Promise<void> {
    await this.copyText(this.questionText(question));
  }

  protected async copyOpenAnswers(): Promise<void> {
    const questions =
      this.snapshot()?.questions.filter((question) => question.type === 'open') ?? [];
    await this.copyText(questions.map((question) => this.questionText(question)).join('\n\n'));
  }

  protected async copyWrongAnswers(): Promise<void> {
    const questions =
      this.snapshot()?.questions.filter(
        (question) =>
          question.type !== 'open' &&
          this.answerFor(question).corrected &&
          !this.isQuestionCorrect(question),
      ) ?? [];
    if (!questions.length) return this.showCopied('Nessuna risposta multipla sbagliata.');
    await this.copyText(questions.map((question) => this.questionText(question)).join('\n\n'));
  }

  protected wrongQuestions(attempt: QuizAttempt): QuizQuestion[] {
    return attempt.snapshot.questions.filter(
      (question) =>
        question.type !== 'open' &&
        attempt.answers.byQuestion[question.id]?.corrected &&
        !this.isCorrectForAttempt(attempt, question),
    );
  }

  protected optionTexts(attempt: QuizAttempt, question: QuizQuestion, correct: boolean): string {
    const selected = new Set(attempt.answers.byQuestion[question.id]?.selectedOptionIds ?? []);
    return (
      question.options
        .filter((option) => (correct ? option.correct : selected.has(option.id)))
        .map((option) => option.text)
        .join(', ') || '—'
    );
  }

  private async start(quizId: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/study-quiz-attempts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      });
      const result = await this.api.readApiResponse<{
        attempt?: QuizAttempt;
        resumed?: boolean;
        error?: string;
      }>(response);
      if (!response.ok || !result.attempt) throw new Error(result.error || 'Avvio non riuscito.');
      this.attempt.set(result.attempt);
      this.resumed.set(result.resumed === true);
      await this.loadHistory(quizId);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Non è stato possibile aprire il quiz.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private mutateAnswer(questionId: number, mutation: (answer: QuestionAnswer) => void): void {
    const current = this.attempt();
    if (!current || current.status === 'completed') return;
    const answers = structuredClone(current.answers);
    const answer = answers.byQuestion[questionId] ?? {};
    mutation(answer);
    answers.byQuestion[questionId] = answer;
    this.attempt.set({ ...current, answers });
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save('save', undefined, false), 600);
  }

  private async save(
    action: string,
    questionId?: number,
    applyResponse = true,
    assessment?: string,
  ): Promise<void> {
    const current = this.attempt();
    if (!current || current.status === 'completed') return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saving.set(true);
    try {
      const response = await fetch(`/api/study-quiz-attempts/${current.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        keepalive: action === 'save',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, questionId, assessment, answers: current.answers }),
      });
      const result = await this.api.readApiResponse<{ attempt?: QuizAttempt; error?: string }>(
        response,
      );
      if (!response.ok || !result.attempt)
        throw new Error(result.error || 'Salvataggio non riuscito.');
      if (applyResponse) this.attempt.set(result.attempt);
      else
        this.attempt.update((latest) =>
          latest
            ? {
                ...latest,
                correctCount: result.attempt!.correctCount,
                assessedCount: result.attempt!.assessedCount,
                updatedAt: result.attempt!.updatedAt,
              }
            : latest,
        );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Salvataggio non riuscito.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadHistory(quizId: number): Promise<void> {
    if (!quizId) return;
    const all = this.auth.isAdmin() ? '&all=1' : '';
    const response = await fetch(`/api/study-quiz-attempts?quizId=${quizId}${all}`, {
      credentials: 'same-origin',
    });
    const result = await this.api.readApiResponse<{ attempts?: QuizAttempt[] }>(response);
    if (response.ok)
      this.history.set(
        (result.attempts ?? []).filter((attempt) => attempt.id !== this.attempt()?.id),
      );
  }

  private questionText(question: QuizQuestion): string {
    const answer = this.answerFor(question);
    const lines = [`Domanda: ${question.prompt}`];
    if (question.type === 'open') {
      lines.push(`Risposta data: ${answer.text || '—'}`);
      if (answer.revealed && question.referenceAnswer)
        lines.push(`Risposta di riferimento: ${question.referenceAnswer}`);
      if (answer.assessment)
        lines.push(`Valutazione: ${answer.assessment === 'correct' ? 'giusta' : 'sbagliata'}`);
    } else {
      lines.push(
        ...question.options.map(
          (option) =>
            `${answer.selectedOptionIds?.includes(option.id) ? '[x]' : '[ ]'} ${option.text}`,
        ),
      );
      lines.push(
        `Risposta data: ${
          question.options
            .filter((option) => answer.selectedOptionIds?.includes(option.id))
            .map((option) => option.text)
            .join(', ') || '—'
        }`,
      );
      if (answer.corrected)
        lines.push(
          `Risposta corretta: ${question.options
            .filter((option) => option.correct)
            .map((option) => option.text)
            .join(', ')}`,
        );
    }
    return lines.join('\n');
  }

  protected isCorrectForAttempt(attempt: QuizAttempt, question: QuizQuestion): boolean {
    const answer = attempt.answers.byQuestion[question.id] ?? {};
    const selected = [...(answer.selectedOptionIds ?? [])].sort((a, b) => a - b);
    const correct = question.options
      .filter((option) => option.correct)
      .map((option) => option.id)
      .sort((a, b) => a - b);
    return (
      selected.length === correct.length && selected.every((id, index) => id === correct[index])
    );
  }

  private async copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopied('Copiato.');
    } catch {
      this.showCopied('Non è stato possibile copiare.');
    }
  }
  private showCopied(message: string): void {
    this.copiedMessage.set(message);
    setTimeout(() => this.copiedMessage.set(''), 2200);
  }
}
