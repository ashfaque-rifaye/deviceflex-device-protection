import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { AttLogo } from "@/components/AttLogo";
import { useAuth } from "@/lib/auth";
import { ACCOUNTS } from "@/data/member";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    returnTo: (s.returnTo as string) || "/myatt",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { returnTo } = Route.useSearch();
  const { login } = useAuth();
  const [stage, setStage] = useState<"id" | "password">("id");
  const [userId, setUserId] = useState("");

  const finish = () => {
    login(userId);
    navigate({ to: returnTo });
  };

  return (
    <div className="min-h-screen bg-white text-[#1D2329]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-[#DCDFE3] p-8 sm:p-10">
          <div className="flex justify-center">
            <AttLogo height={30} />
          </div>

          {stage === "id" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (userId) setStage("password");
              }}
              className="mt-8"
            >
              <h1 className="text-center text-3xl font-extrabold leading-tight">
                Sign in
                <br />
                <span className="text-2xl">to my Account</span>
              </h1>

              <label className="mt-8 block text-sm font-bold">User ID</label>
              <input
                autoFocus
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                className="mt-2 w-full rounded-lg border border-[#00388F] px-4 py-3.5 text-sm outline-none focus:border-[#00388F]"
              />

              <button
                type="submit"
                disabled={!userId}
                className={`mt-6 w-full rounded-full py-3.5 text-base font-bold text-white ${userId ? "bg-[#00388F] hover:bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
              >
                Continue
              </button>

              {/* Demo accounts */}
              <div className="mt-7 border-t border-[#DCDFE3] pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                  Demo accounts
                </p>
                <div className="mt-3 space-y-2">
                  {ACCOUNTS.map((a) => (
                    <button
                      key={a.userId}
                      type="button"
                      onClick={() => {
                        setUserId(a.userId);
                        setStage("password");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-[#DCDFE3] p-3 text-left hover:border-[#00388F]"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${a.enrolled ? "bg-[#EAF7EE]" : "bg-[#FFF3E0]"}`}
                      >
                        {a.enrolled ? (
                          <ShieldCheck className="h-4 w-4 text-[#1F7A3D]" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-[#9E5D00]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold">{a.userId}</span>
                        <span className="block text-xs text-[#686E74]">
                          {a.firstName} {a.lastName} ·{" "}
                          {a.enrolled
                            ? `Protect Advantage ${a.tier === "family" ? "Family" : a.tier}`
                            : `Not enrolled · ${a.devices.filter((d) => d.eligible).length} eligible devices`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-4 text-sm font-bold text-[#0072B2]">
                <a href="#" className="block hover:underline">
                  Forgot user ID?
                </a>
                <a href="#" className="block hover:underline">
                  Don't have a user ID? Create one now
                </a>
                <a href="#" className="block hover:underline">
                  Pay without signing in
                </a>
                <a href="#" className="block hover:underline">
                  Sign in with the AT&amp;T app
                </a>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                finish();
              }}
              className="mt-8"
            >
              <h1 className="text-center text-3xl font-extrabold leading-tight">
                Sign in
                <br />
                <span className="text-2xl">to my Account</span>
              </h1>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-4 py-3 text-sm">
                <span className="font-bold">{userId}</span>
                <button
                  type="button"
                  onClick={() => setStage("id")}
                  className="font-bold text-[#0072B2] hover:underline"
                >
                  Edit
                </button>
              </div>
              <label className="mt-6 block text-sm font-bold">Password</label>
              <input
                autoFocus
                type="password"
                defaultValue="demopassword"
                className="mt-2 w-full rounded-lg border border-[#00388F] px-4 py-3.5 text-sm outline-none focus:border-[#00388F]"
              />
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" className="att-checkbox shrink-0" /> Save user ID
              </label>
              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-[#00388F] py-3.5 text-base font-bold text-white hover:bg-[#0057B8]"
              >
                Sign in
              </button>
              <div className="mt-6 text-center">
                <a href="#" className="text-sm font-bold text-[#0072B2] hover:underline">
                  Forgot password?
                </a>
              </div>
            </form>
          )}
        </div>
        <Link to="/" className="mt-6 text-sm font-bold text-[#0072B2] hover:underline">
          Return to att.com
        </Link>
      </div>
    </div>
  );
}
