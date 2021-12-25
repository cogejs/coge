export class ErrorWithInstruction extends Error {
  constructor(message: string, public instruction: string) {
    super(message);
  }
}
