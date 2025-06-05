import { Hero } from "@/components/common/Hero";
import { Navbar } from "@/components/common/Navbar";

export function Home() {
  return (
    <div className="px-8 py-2 bg-zinc-50 dark:bg-zinc-900">
      <Navbar></Navbar>
      <Hero></Hero>
    </div>
  );
}