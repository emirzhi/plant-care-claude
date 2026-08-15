import LoginForm from "./LoginForm";

// searchParams are read here (server) rather than with useSearchParams in the
// client component — that hook forces a client-side bail-out, which rendered
// the whole login screen blank until JS loaded.
export default async function LoginPage({ searchParams }) {
  const { next, error } = await searchParams;

  return (
    <LoginForm
      nextPath={typeof next === "string" ? next : "/plants"}
      callbackError={typeof error === "string" ? error : null}
    />
  );
}
