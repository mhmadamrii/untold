import type { StoryStatus, StoryType, Visibility } from '@untold/db/enums';

export const STORY_TYPE_LABEL: Record<StoryType, string> = {
  PERSONAL: 'Personal Story',
  MEMOIR: 'Memoir',
  LIFE_EXPERIENCE: 'Life Experience',
  FICTION: 'Fiction',
  SHORT_STORY: 'Short Story',
  NOVEL: 'Novel',
  ROMANCE: 'Romance',
  MYSTERY: 'Mystery',
  FANTASY: 'Fantasy',
  ADVENTURE: 'Adventure',
  HORROR: 'Horror',
  HISTORICAL: 'Historical',
  INSPIRATIONAL: 'Inspirational',
  CHILDRENS_STORY: "Children's Story",
};

export const STORY_STATUS_LABEL: Record<StoryStatus, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PRIVATE: 'Private',
  LINK: 'Anyone with the link',
  PUBLIC: 'Public',
};
