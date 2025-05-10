import { NestFactory } from '@nestjs/core';
import { SimplifyModule } from './modules/simplify/simplify.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(SimplifyModule, {
    logger: ['log', 'error', 'warn'],
  });
}
bootstrap().catch((err) => {
  console.error('Error starting worker:', err);
  process.exit(1);
});
