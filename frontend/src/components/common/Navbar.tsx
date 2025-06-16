import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import appLogo from "@/assets/darkLogo.png";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  title: string;
  url: string;
}

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const Navbar = ({
  logo = {
    url: "/",
    src: appLogo,
    alt: "logo",
    title: "Leetcode",
  },
  menu = [
    { title: "Explore", url: "/" },
    { title: "Problems", url: "/problemset" },
  ],
  auth = {
    login: { title: "Login", url: "/login" },
    signup: { title: "Sign up", url: "/signup" },
  },
}: NavbarProps) => {
  const location = useLocation();
  const { token, setToken } = useAuth();

  return (
    <section className="py-4">
      {/* Desktop Menu */}
      <nav className="hidden justify-between sm:flex">
        <div className="flex items-center gap-6">
          <Link to={logo.url} className="flex items-center gap-2">
            <img src={logo.src} className="max-h-8" alt={logo.alt} />
            <span className="text-xl font-semibold tracking-tighter">
              {logo.title}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {menu.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className="text-md font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {token === null ?
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={auth.login.url} state={{ from: location.pathname }}>{auth.login.title}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={auth.signup.url} state={{ from: location.pathname }}>{auth.signup.title}</Link>
              </Button>
            </> :
            <Button size="sm" onClick={() => {
              setToken(null);
              localStorage.removeItem("token");
            }}>
              Sign out
            </Button>
          }
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between">
          <Link to={logo.url} className="flex items-center gap-2">
            <img src={logo.src} className="max-h-8" alt={logo.alt} />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link to={logo.url} className="flex items-center gap-2">
                    <img src={logo.src} className="max-h-8" alt={logo.alt} />
                    <span className="text-lg font-semibold tracking-tighter">
                      {logo.title}
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                {menu.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="text-md font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 pt-4">
                {token === null ? 
                  <>
                    <Button asChild variant="outline">
                      <Link to={auth.login.url} state={{ from: location.pathname }}>{auth.login.title}</Link>
                    </Button>
                    <Button asChild>
                      <Link to={auth.signup.url} state={{ from: location.pathname }}>{auth.signup.title}</Link>
                    </Button>
                  </> :
                  <Button  onClick={() => {
                    setToken(null);
                    localStorage.removeItem("token");
                  }}>
                    Sign out
                  </Button>
                }
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
};

export { Navbar };
