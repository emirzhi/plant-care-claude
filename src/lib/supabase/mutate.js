// Supabase .insert()/.update()/.delete() on an RLS-filtered row returns
// success with zero rows if the policy denies the write — no thrown error.
// Every write in this codebase goes through this helper: always chain
// .select() and treat an empty result as an error, never trust the absence
// of `error` alone.
export async function mutateOrThrow(builder, { allowEmpty = false } = {}) {
  const { data, error } = await builder.select();

  if (error) {
    throw new Error(error.message);
  }
  if (!allowEmpty && (!data || data.length === 0)) {
    throw new Error(
      "Write affected zero rows — the row may not exist, or Row Level Security denied it.",
    );
  }
  return data;
}
