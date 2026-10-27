import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AppBarComponent } from '../shared/app-bar/app-bar.component'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { IonContent, IonicModule } from '@ionic/angular'
import {
  ASSISTANT_MESSAGE_MAX,
  AssistantMessage,
  HistoryAssistantService
} from '../services/history-assistant.service'

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonicModule, AppBarComponent],
  templateUrl: './assistant.page.html',
  styleUrls: ['./assistant.page.scss']
})
export class AssistantPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent

  private auth = inject(AngularFireAuth)
  private assistant = inject(HistoryAssistantService)
  private destroyRef = inject(DestroyRef)
  private changeDetector = inject(ChangeDetectorRef)
  private uid: string | null = null
  private revision = 0

  readonly messageMax = ASSISTANT_MESSAGE_MAX
  readonly suggestions = [
    'Why is the Battle of Mactan important?',
    'Compare Jose Rizal and Andres Bonifacio.',
    'Ipaliwanag ang EDSA People Power Revolution.'
  ]

  messages: AssistantMessage[] = []
  prompt = ''
  busy = false
  authLoading = true
  signedIn = false
  error = ''
  notice = ''

  ngOnInit(): void {
    this.auth.authState.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        const uid = user && !user.isAnonymous ? user.uid : null
        if (this.uid !== uid) {
          this.newChat()
        }
        this.uid = uid
        this.signedIn = !!uid
        this.authLoading = false
      },
      error: () => {
        this.newChat()
        this.uid = null
        this.signedIn = false
        this.authLoading = false
        this.error = 'Could not check your account. Please sign in again.'
      }
    })
  }

  ngOnDestroy(): void {
    this.revision++
  }

  get canSend(): boolean {
    return this.signedIn && !this.authLoading && !this.busy && !!this.prompt.trim() && this.prompt.length <= this.messageMax
  }

  newChat(): void {
    this.revision++
    this.messages = []
    this.prompt = ''
    this.error = ''
    this.notice = ''
    this.busy = false
  }

  askSuggestion(suggestion: string): void {
    this.prompt = suggestion
    void this.send()
  }

  async send(): Promise<void> {
    if (!this.canSend) {
      return
    }
    const question = this.prompt.trim()
    const history = [...this.messages]
    const revision = this.revision
    this.messages = [...history, { role: 'user', text: question }]
    this.prompt = ''
    this.error = ''
    this.notice = ''
    this.busy = true
    this.scrollToLatest()

    try {
      const reply = await this.assistant.ask(history, question)
      if (this.revision !== revision) {
        return
      }
      this.messages = [...this.messages, { role: 'model', text: reply.text }]
      this.notice = reply.truncated ? 'This answer was shortened. Ask a follow-up for more detail.' : ''
    } catch (error) {
      if (this.revision !== revision) {
        return
      }
      this.messages = history
      this.prompt = question
      this.error = error instanceof Error ? error.message : 'Could not get an answer. Please try again.'
    } finally {
      if (this.revision === revision) {
        this.busy = false
        this.scrollToLatest()
      }
    }
  }

  private scrollToLatest(): void {
    this.changeDetector.detectChanges()
    const revision = this.revision
    requestAnimationFrame(() => {
      if (revision === this.revision) {
        void this.content?.scrollToBottom(200)
      }
    })
  }
}
