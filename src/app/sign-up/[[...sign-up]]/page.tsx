import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <SignUp 
        appearance={{
          elements: {
            headerTitle: "Criar Conta - APP FAIXA PRETA",
            headerSubtitle: "Faça seu cadastro para acessar a academia"
          }
        }}
      />
    </div>
  );
}
