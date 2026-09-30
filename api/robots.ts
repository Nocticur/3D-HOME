import { handleRobotsGet } from '../src/api/edge/seo.ts';

import { createVercelContext } from './_context.ts';

export default {
  fetch(request: Request) {
    return handleRobotsGet(createVercelContext(request));
  },
};
