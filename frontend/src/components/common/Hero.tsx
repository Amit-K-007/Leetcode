import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import appLogo from "@/assets/darkLogo.png";
import typescriptLogo from "@/assets/typescript-color.svg";
import reactLogo from "@/assets/react-color.svg";
import tailwindLogo from "@/assets/tailwindcss-color.svg";
import expressLogo from "@/assets/express-color.svg";
import postgresLogo from "@/assets/postgresql-color.svg";
import dockerLogo from "@/assets/docker-color.svg";
import redisLogo from "@/assets/redis-color.svg";
import socketioLogo from "@/assets/socketdotio-color.svg";
import squarePattern from "@/assets/square-alt-grid.svg";
import { useNavigate } from "react-router-dom";

const techStack1 = [
  { src: typescriptLogo, alt: "Typescript" },
  { src: reactLogo, alt: "React" },
  { src: tailwindLogo, alt: "Tailwind CSS" },
  { src: socketioLogo, alt: "Socket.io" },
  { src: expressLogo, alt: "Express" },
  { src: postgresLogo, alt: "Postgresql" },
  { src: dockerLogo, alt: "Docker" },
  { src: redisLogo, alt: "Redis" },
]

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100">
        <img
          alt="background"
          src={squarePattern}
          className="opacity-80 [mask-image:radial-gradient(75%_75%_at_center,white,transparent)]"
        />
      </div>
      <div className="relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="rounded-xl bg-zinc-100/50 dark:bg-zinc-800/40 p-4 shadow-sm backdrop-blur-sm">
              <img
                src={appLogo}
                alt="logo"
                className="h-16"
              />
            </div>
            <div>
              <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 lg:text-5xl">
                Master Data Structures & Algorithms
              </h1>
              <p className="mx-auto max-w-3xl text-zinc-600 dark:text-zinc-400 lg:text-xl">
                Solve diverse coding problems designed to challenge your skills and deepen your understanding. 
                Practice regularly to build confidence and ace your technical interviews.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button 
                className="shadow-sm transition-shadow hover:shadow"
                onClick={() => navigate("/problemset")}
              >
                Start Solving
              </Button>
              <a
                href="https://github.com/Amit-K-007/Leetcode"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="outline" className="group border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
                  Learn more{" "}
                  <ExternalLink className="ml-2 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </a>
            </div>
            <div className="mt-20 flex flex-col items-center gap-5">
              <p className="font-medium text-zinc-500 dark:text-zinc-400 lg:text-left">
                Built with open-source technologies
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {techStack1.map((tech, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "group flex aspect-square h-12 items-center justify-center p-0 border-zinc-300 dark:border-zinc-700"
                    )}
                  >
                    <img
                      src={tech.src}
                      alt={tech.alt}
                      className="h-6 saturate-0 transition-all group-hover:saturate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
