import { signIn } from "@/auth";
import React from "react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <h1 className="mb-6 text-3xl font-bold">Logga in</h1>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button className="px-6 py-3 font-semibold text-black bg-white rounded-md hover:bg-gray-200">
          Logga in med Google
        </button>
      </form>
    </div>
  );
}
