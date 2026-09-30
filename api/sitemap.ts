import { handleSitemapGet } from '../src/api/edge/seo.ts';

import { createVercelContext } from './_context.ts';

export default {
  fetch(request: Request) {
    return handleSitemapGet(createVercelContext(request));
  },
};
