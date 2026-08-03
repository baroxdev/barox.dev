export class PostValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PostValidationError'
  }
}
