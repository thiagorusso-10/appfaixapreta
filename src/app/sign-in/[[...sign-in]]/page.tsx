import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <SignIn 
        appearance={{
          elements: {
            headerTitle: "Sign in to APP FAIXA PRETA",
            headerSubtitle: "Acesse o sistema com sua conta"
          }
        }}
      />
    </div>
  );
}
