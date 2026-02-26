import { SetMetadata } from '@nestjs/common';

export const DEPRECATED_KEY = 'deprecated';
export const DeprecatedEndpoint = (replacementRoute: string) =>
  SetMetadata(DEPRECATED_KEY, replacementRoute);
