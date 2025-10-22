import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { MessageSquare, Star, Loader2 } from 'lucide-react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Alert, AlertDescription } from './ui/alert'

export function FeedbackDialog() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (rating === 0) {
      notify.warning('Avaliação necessária', 'Por favor, selecione uma classificação de estrelas')
      return
    }

    setSubmitting(true)
    try {
      await api.submitFeedback(rating, feedback)
      setSubmitted(true)
      notify.success('Feedback enviado!', 'Muito obrigado pelo seu feedback!')
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setRating(0)
        setFeedback('')
        setSubmitted(false)
        setOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      notify.error('Erro ao enviar feedback', error?.message || 'Tente novamente')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setRating(0)
    setFeedback('')
    setSubmitted(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          title="Enviar Feedback"
        >
          <MessageSquare className="w-5 h-5" style={{ color: '#5C8599' }} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#5C8599' }}>
            💬 Envie seu Feedback
          </DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para nós! Ajude-nos a melhorar o Autazul.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#5C8599' }}>
              Muito obrigado pelo seu feedback!
            </h3>
            <p className="text-sm text-muted-foreground">
              Recebemos sua mensagem e vamos analisá-la com atenção.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div className="space-y-3">
              <Label>Como você avalia o sistema?</Label>
              <div className="flex items-center gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1"
                    style={{ 
                      color: (hoveredRating || rating) >= star ? '#FFD700' : '#D1D5DB',
                      focusRingColor: '#15C3D6'
                    }}
                  >
                    <Star
                      className="w-10 h-10"
                      fill={(hoveredRating || rating) >= star ? '#FFD700' : 'none'}
                      stroke={(hoveredRating || rating) >= star ? '#FFD700' : 'currentColor'}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 1 && '😞 Muito insatisfeito'}
                  {rating === 2 && '😕 Insatisfeito'}
                  {rating === 3 && '😐 Neutro'}
                  {rating === 4 && '😊 Satisfeito'}
                  {rating === 5 && '😍 Muito satisfeito'}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Sugestões de melhoria (opcional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Compartilhe suas ideias para melhorarmos o Autazul..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {feedback.length}/500 caracteres
              </p>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertDescription className="text-xs">
                ℹ️ Seu feedback será enviado para nossa equipe e nos ajudará a criar 
                uma experiência cada vez melhor para você.
              </AlertDescription>
            </Alert>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                style={{ backgroundColor: '#15C3D6' }}
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Feedback'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
