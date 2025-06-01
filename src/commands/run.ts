import { Command } from '@oclif/core';

class Run extends Command {
  static override args = {};
  static override description = 'Run codemod';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {};

  public async run(): Promise<void> {
    const start = performance.now();
    console.log('🐸🐸🐸 hello wonderer');

    const timeInSeconds = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`Transformed files successfully in ${timeInSeconds} seconds ✨`);
  }
}

export default Run;
