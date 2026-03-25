import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth, googleProvider, hasFirebaseConfig } from "./firebase";
import { loadCachedInputs, saveCachedInputs, getOrCreateGuestId } from "./lib/storage";
import { generateCoverLetter, getUsageStatus } from "./services/api";

function App() {
  const cached = loadCachedInputs();
  const [name, setName] = useState(cached.name);
  const [skills, setSkills] = useState(cached.skills);
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [guestId] = useState(() => getOrCreateGuestId());
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [remaining, setRemaining] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoggedIn = Boolean(firebaseUser);
  const userId = useMemo(() => (isLoggedIn ? firebaseUser.uid : guestId), [isLoggedIn, firebaseUser, guestId]);
  const dailyLimit = isLoggedIn ? 5 : 3;

  useEffect(() => {
    saveCachedInputs({ name, skills });
  }, [name, skills]);

  useEffect(() => {
    if (!auth) {
      setRemaining(3);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user ?? null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const usage = await getUsageStatus({ userId, isLoggedIn });
        setRemaining(usage.remaining);
      } catch {
        setRemaining(dailyLimit);
      }
    };

    loadUsage();
  }, [userId, isLoggedIn, dailyLimit]);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setErrorMessage("Firebase is not configured. Add frontend env variables to enable Google login.");
      return;
    }

    try {
      setErrorMessage("");
      await signInWithPopup(auth, googleProvider);
    } catch {
      setErrorMessage("Google sign-in failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    await signOut(auth);
    setErrorMessage("");
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !skills.trim() || !jobDescription.trim()) {
      setErrorMessage("Please fill in Name, Skills, and Job Description.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await generateCoverLetter({
        name,
        skills,
        jobDescription,
        userId,
        isLoggedIn,
      });

      setCoverLetter(data.coverLetter);
      setRemaining(data.remaining);
    } catch (error) {
      setErrorMessage(error.message || "Failed to generate cover letter.");
      if (error.remaining === 0) {
        setRemaining(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!coverLetter.trim()) return;

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(coverLetter);
    } catch {
      setErrorMessage("Could not copy to clipboard.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#ffe8c8_0%,#fef7ec_35%,#f4f8ff_70%,#edf2ff_100%)] px-4 py-8 text-slate-800">
      <main className="mx-auto w-full max-w-5xl rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-[0_20px_55px_rgba(30,41,59,0.12)] backdrop-blur md:p-8">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">AI Cover Letter Studio</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-slate-900 md:text-4xl">Tailor your cover letter in minutes</h1>
            <p className="mt-2 text-sm text-slate-600">Daily remaining generations: <span className="font-semibold text-slate-900">{remaining}</span> / {dailyLimit}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {hasFirebaseConfig ? "Sign in with Google" : "Google Login Unavailable"}
              </button>
            ) : (
              <>
                <p className="text-sm text-slate-600">Signed in as {firebaseUser.email || "Google User"}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        <form onSubmit={handleGenerate} className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Your full name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Skills</span>
              <textarea
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Example: React, Node.js, API design, team leadership"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Job Description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Paste the job description here"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isLoading ? "Generating..." : "Generate Cover Letter"}
            </button>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {remaining === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                You have reached your daily generation limit. Please try again tomorrow.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl text-slate-900">Generated Cover Letter</h2>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!coverLetter.trim() || isCopying}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCopying ? "Copying..." : "Copy to Clipboard"}
              </button>
            </div>

            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              rows={20}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="Your generated cover letter will appear here and remain editable."
            />
          </section>
        </form>
      </main>
    </div>
  );
}

export default App;
