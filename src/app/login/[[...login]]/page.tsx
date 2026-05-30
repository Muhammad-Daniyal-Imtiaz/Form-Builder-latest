import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <SignIn path="/login" routing="path" signUpUrl="/signup" />
    </div>
  );
}
