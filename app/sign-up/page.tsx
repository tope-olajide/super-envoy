import AuthNavbar from "@/components/AuthNavBar";
import { SignupForm } from "./SignUpForm";


export default function SignupPage() {
    return (
        <>
            <AuthNavbar />
            <main className="min-h-screen flex items-center justify-center p-4">
            <SignupForm />
        </main></>
  )
}
