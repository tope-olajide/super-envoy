"use client";



import AuthNavbar from "@/components/AuthNavBar";
import { SigninForm } from "./SigninForm";

export default function LoginPage() {
  return (
    <><AuthNavbar />
      <main className="min-h-screen flex items-center justify-center p-4"><SigninForm /></main>
    </>
  );
}
