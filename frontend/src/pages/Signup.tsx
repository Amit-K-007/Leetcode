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
import googleLogo from "@/assets/google.svg"
import { Link, useNavigate } from "react-router-dom"
import { CardLogo } from "@/components/common/CardLogo"
import { useAuth } from "@/hooks/useAuth"
import { useState, type FormEvent } from "react"
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export function Signup() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/accounts/signup`, { email, password });
      const { token } = response.data;

      setToken(token);
      localStorage.setItem("token", token);

      navigate("/");
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to sign up. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <Card className="w-full max-w-sm">
        <CardLogo />
        <CardHeader className="mt-4">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
          <CardAction>
            <Button variant="link" onClick={() => navigate("/login")}>Login</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={ handleSignup }>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <div className="flex justify-center text-center text-sm">or</div>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <img src={googleLogo} alt="Google" className="w-6 h-6 mr-2" /> Sign up with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}