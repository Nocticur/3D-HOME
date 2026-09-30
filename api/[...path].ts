import { dispatchApiRequest } from '../src/api/edge/router.ts';

import { createVercelContext } from './_context.ts';

export default {
  fetch(request: Request) {
    return dispatchApiRequest(createVercelContext(request));
  },
};
