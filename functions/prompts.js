import { PROMPT_TYPES } from "./promptTypes";

export const prompts = {
  [PROMPT_TYPES.BOOK_RECOMMENDATIONS]: {
    prompt: "Generate book recommendations..",
    schema: null,
  },
  [PROMPT_TYPES.MOVIE_REVIEWS]: {
    prompt: "Generate movie reviews in JSON format..",
    schema: {},
  },
};
