/** État renvoyé par les Server Actions utilisées avec useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = {};
