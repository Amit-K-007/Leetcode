import appLogo from "@/assets/darkLogo.png"
import { Link } from "react-router-dom";

interface CardLogoProps {
  size?: string 
}

export function CardLogo({ size = "h-16" }: Readonly<CardLogoProps>) {
  return (
    <div className="flex justify-center">
      <Link to="/">
        <img src={appLogo} alt="logo" className={`${size} rounded-xl hover:shadow-sm transition-shadow`} />
      </Link>
    </div>
  );
}