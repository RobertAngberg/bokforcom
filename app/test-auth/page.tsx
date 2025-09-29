"use client";

import { useState } from "react";
import { authClient } from "../_lib/auth-client";

export default function BetterAuthTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        setMessage(`Signup Error: ${error.message}`);
      } else {
        setMessage(`Signup Success! Check your email to verify. User: ${data?.user?.email}`);
      }
    } catch (err) {
      setMessage(`Signup Error: ${err}`);
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (error) {
        setMessage(`Signin Error: ${error.message}`);
      } else {
        setMessage(`Signin Success! Welcome ${data?.user?.email}`);
      }
    } catch (err) {
      setMessage(`Signin Error: ${err}`);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      setMessage("Signed out successfully!");
    } catch (err) {
      setMessage(`Signout Error: ${err}`);
    }
    setLoading(false);
  };

  if (isPending) return <div>Loading session...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Better Auth Test</h1>

      {/* Session Info */}
      <div className="mb-6 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Session:</h3>
        {session ? (
          <div>
            <p>Email: {session.user.email}</p>
            <p>Name: {session.user.name}</p>
            <p>ID: {session.user.id}</p>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "..." : "Sign Out"}
            </button>
          </div>
        ) : (
          <p>No active session</p>
        )}
      </div>

      {!session && (
        <>
          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">Sign Up</h3>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mb-2 border rounded text-gray-800"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-2 border rounded text-gray-800"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-3 border rounded text-gray-800"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "..." : "Sign Up"}
            </button>
          </form>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn}>
            <h3 className="font-semibold mb-3 text-gray-700">Sign In</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-2 border rounded text-gray-800"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-3 border rounded text-gray-800"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "..." : "Sign In"}
            </button>
          </form>
        </>
      )}

      {/* Messages */}
      {message && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-gray-800">{message}</p>
        </div>
      )}
    </div>
  );
}
