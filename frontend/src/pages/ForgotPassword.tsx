import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { CardLogo } from "@/components/common/CardLogo"

export function ForgotPassword() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // await axios.post("/api/forgot-password", { email });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <Card className="w-full max-w-sm">
        <CardLogo />
        <CardHeader className="mt-4">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            {submitted
              ? "If an account with this email exists, a reset link has been sent."
              : "Enter your email to receive a password reset link."}
          </CardDescription>
          {!submitted && (
            <CardAction>
                <Button variant="link" onClick={() => navigate("/login")}>
                Login
                </Button>
            </CardAction>
          )}
        </CardHeader>

        {!submitted ? (
          <>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" onClick={handleSubmit}>
                Send Reset Link
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
